import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import { FIXTURES } from "@/server/ai/fixtures";
import type { DeployTarget } from "@/server/deploy";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-deploy-landing-test-"));
  baseDir = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function ventureWithLandingPage(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  const planned = await ventures.advance(v.id, "planned", { baseDir });
  const building = await ventures.advance(planned.id, "building", { baseDir });
  await artifacts.create(
    { ventureId: v.id, kind: "landing_page", stage: "building", content: FIXTURES["write-landing-page"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  return building;
}

describe("deployLandingPage", () => {
  it("deploys the latest landing_page artifact and stores the resulting url on the venture", async () => {
    const { deployLandingPage } = await import("@/server/ventures/deployLandingPage");
    const venture = await ventureWithLandingPage(baseDir);
    const target: DeployTarget = { deploy: vi.fn(async () => ({ url: "https://example.vercel.app", live: true })) };

    const result = await deployLandingPage(venture, { baseDir, target });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toBe("https://example.vercel.app");
      expect(result.live).toBe(true);
      expect(result.venture.launchUrl).toBe("https://example.vercel.app");
    }
    const stored = await ventures.get(venture.id, { baseDir });
    expect(stored?.launchUrl).toBe("https://example.vercel.app");
  });

  it("overwrites the previous launch url on redeploy", async () => {
    const { deployLandingPage } = await import("@/server/ventures/deployLandingPage");
    const venture = await ventureWithLandingPage(baseDir);
    const target: DeployTarget = {
      deploy: vi
        .fn()
        .mockResolvedValueOnce({ url: "https://first.vercel.app", live: true })
        .mockResolvedValueOnce({ url: "https://second.vercel.app", live: true }),
    };

    await deployLandingPage(venture, { baseDir, target });
    const second = await deployLandingPage(venture, { baseDir, target });

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.venture.launchUrl).toBe("https://second.vercel.app");
  });

  it("fails readably when there is no landing page yet, without a network call", async () => {
    const { deployLandingPage } = await import("@/server/ventures/deployLandingPage");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    const validated = await ventures.advance(v.id, "validated", { baseDir });
    const target: DeployTarget = { deploy: vi.fn() };

    const result = await deployLandingPage(validated, { baseDir, target });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
    expect(target.deploy).not.toHaveBeenCalled();
  });

  it("returns a readable message and leaves the venture unchanged when the deploy target fails", async () => {
    const { deployLandingPage } = await import("@/server/ventures/deployLandingPage");
    const venture = await ventureWithLandingPage(baseDir);
    const target: DeployTarget = { deploy: vi.fn(async () => { throw new Error("provider_error: 500"); }) };

    const result = await deployLandingPage(venture, { baseDir, target });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("deploy_failed");
      expect(result.message).not.toMatch(/500|provider_error/);
    }
    const stored = await ventures.get(venture.id, { baseDir });
    expect(stored?.launchUrl).toBeNull();
  });
});
