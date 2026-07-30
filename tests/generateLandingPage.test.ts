import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import { FIXTURES } from "@/server/ai/fixtures";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-landing-page-test-"));
  baseDir = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function stubProvider(responses: Array<CompletionResult | Error>): Provider {
  let call = 0;
  const complete = vi.fn(async (): Promise<CompletionResult> => {
    const next = responses[Math.min(call, responses.length - 1)];
    call++;
    if (next instanceof Error) throw next;
    return next;
  });
  return { complete };
}

const landingResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["write-landing-page"]),
  promptTokens: 100,
  completionTokens: 100,
};

async function plannedVentureWithPlan(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  const planned = await ventures.advance(v.id, "planned", { baseDir });
  await artifacts.create(
    { ventureId: v.id, kind: "plan", stage: "planned", content: FIXTURES["plan-venture"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  return planned;
}

describe("generateLandingPage", () => {
  it("saves a landing_page artifact generated from the plan", async () => {
    const { generateLandingPage } = await import("@/server/ventures/generateLandingPage");
    const venture = await plannedVentureWithPlan(baseDir);

    const result = await generateLandingPage(venture, { baseDir, provider: stubProvider([landingResponse]) });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact.kind).toBe("landing_page");
      const content = result.artifact.content as { headline: string; benefits: unknown[] };
      expect(content.headline.length).toBeGreaterThan(0);
      expect(content.benefits.length).toBe(3);
    }

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "landing_page")).toHaveLength(1);
  });

  it("versions a second landing page without overwriting the first", async () => {
    const { generateLandingPage } = await import("@/server/ventures/generateLandingPage");
    const venture = await plannedVentureWithPlan(baseDir);

    await generateLandingPage(venture, { baseDir, provider: stubProvider([landingResponse]) });
    await generateLandingPage(venture, { baseDir, provider: stubProvider([landingResponse]) });

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "landing_page")).toHaveLength(2);
  });

  it("fails readably when there is no plan yet", async () => {
    const { generateLandingPage } = await import("@/server/ventures/generateLandingPage");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    const validated = await ventures.advance(v.id, "validated", { baseDir });

    const result = await generateLandingPage(validated, { baseDir, provider: stubProvider([landingResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
  });
});
