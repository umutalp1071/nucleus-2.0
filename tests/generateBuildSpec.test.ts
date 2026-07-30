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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-build-spec-test-"));
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

const buildSpecResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["generate-build-spec"]),
  promptTokens: 100,
  completionTokens: 100,
};

async function plannedVentureWithArtifacts(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  const planned = await ventures.advance(v.id, "planned", { baseDir });
  await artifacts.create(
    { ventureId: v.id, kind: "plan", stage: "planned", content: FIXTURES["plan-venture"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  await artifacts.create(
    { ventureId: v.id, kind: "mvp_scope", stage: "planned", content: FIXTURES["scope-mvp"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  return planned;
}

describe("generateBuildSpec", () => {
  it("saves a build_spec artifact generated from the plan and MVP scope", async () => {
    const { generateBuildSpec } = await import("@/server/ventures/generateBuildSpec");
    const venture = await plannedVentureWithArtifacts(baseDir);

    const result = await generateBuildSpec(venture, { baseDir, provider: stubProvider([buildSpecResponse]) });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact.kind).toBe("build_spec");
      const content = result.artifact.content as { userStories: unknown[]; outOfScope: string[]; firstCommit: string };
      expect(content.userStories.length).toBeGreaterThanOrEqual(3);
      expect(content.outOfScope.length).toBeGreaterThanOrEqual(3);
      expect(content.firstCommit.length).toBeGreaterThan(0);
    }

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "build_spec")).toHaveLength(1);
  });

  it("versions a second spec without overwriting the first", async () => {
    const { generateBuildSpec } = await import("@/server/ventures/generateBuildSpec");
    const venture = await plannedVentureWithArtifacts(baseDir);

    await generateBuildSpec(venture, { baseDir, provider: stubProvider([buildSpecResponse]) });
    await generateBuildSpec(venture, { baseDir, provider: stubProvider([buildSpecResponse]) });

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "build_spec")).toHaveLength(2);
  });

  it("records a Decision with inputRefs pointing at both the plan and MVP scope artifacts", async () => {
    const { generateBuildSpec } = await import("@/server/ventures/generateBuildSpec");
    const decisions = await import("@/server/db/repositories/decisions");
    const venture = await plannedVentureWithArtifacts(baseDir);
    const planArtifact = (await artifacts.listByVenture(venture.id, { baseDir })).find((a) => a.kind === "plan")!;
    const mvpArtifact = (await artifacts.listByVenture(venture.id, { baseDir })).find((a) => a.kind === "mvp_scope")!;

    const result = await generateBuildSpec(venture, { baseDir, provider: stubProvider([buildSpecResponse]) });
    expect(result.ok).toBe(true);

    const decision = (await decisions.listByVenture(venture.id, { baseDir })).find((d) => d.task === "generate-build-spec")!;
    expect(decision.inputRefs.sort()).toEqual([planArtifact.id, mvpArtifact.id].sort());
    expect(decision.modelId).not.toBe("generate-build-spec");
  });

  it("fails readably when the plan or MVP scope is missing", async () => {
    const { generateBuildSpec } = await import("@/server/ventures/generateBuildSpec");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    const validated = await ventures.advance(v.id, "validated", { baseDir });

    const result = await generateBuildSpec(validated, { baseDir, provider: stubProvider([buildSpecResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
  });
});
