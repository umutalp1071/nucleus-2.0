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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-regenerate-test-"));
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

describe("regenerateArtifact: landing_page", () => {
  it("regenerates landing copy with feedback and versions it without overwriting", async () => {
    const { regenerateArtifact } = await import("@/server/ventures/regenerateArtifact");
    const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
    await ventures.advance(v.id, "validated", { baseDir });
    const planned = await ventures.advance(v.id, "planned", { baseDir });
    await artifacts.create(
      { ventureId: v.id, kind: "plan", stage: "planned", content: FIXTURES["plan-venture"], model: "mock", costUsd: 0, demo: false },
      { baseDir }
    );
    await artifacts.create(
      { ventureId: v.id, kind: "landing_page", stage: "planned", content: FIXTURES["write-landing-page"], model: "mock", costUsd: 0, demo: false },
      { baseDir }
    );

    const result = await regenerateArtifact(planned, "landing_page", "make the headline punchier", {
      baseDir,
      provider: stubProvider([landingResponse]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.artifact.kind).toBe("landing_page");
    const saved = await artifacts.listByVenture(v.id, { baseDir });
    expect(saved.filter((a) => a.kind === "landing_page")).toHaveLength(2);
  });
});
