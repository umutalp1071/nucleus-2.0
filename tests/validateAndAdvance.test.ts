import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-validate-test-"));
  baseDir = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function verdictResponse(score: number, recommendation: "build" | "refine" | "kill"): CompletionResult {
  return {
    text: JSON.stringify({
      score,
      recommendation,
      headline: "headline",
      marketSize: { estimate: "$1M", confidence: "low", reasoning: "test" },
      audience: { who: "someone", painLevel: "painful" },
      risks: [
        { risk: "a", severity: "low" },
        { risk: "b", severity: "medium" },
      ],
      moat: "none",
      cheapestTest: "landing page",
      whyNot: "might not work",
    }),
    promptTokens: 100,
    completionTokens: 100,
  };
}

const competitorsResponse: CompletionResult = {
  text: JSON.stringify({
    competitors: [
      { name: "A", whatTheyDo: "x", weakness: "y", howYouWin: "z" },
      { name: "B", whatTheyDo: "x", weakness: "y", howYouWin: "z" },
      { name: "C", whatTheyDo: "x", weakness: "y", howYouWin: "z" },
    ],
    differentiationVerdict: "thin",
    crowdedness: "high",
  }),
  promptTokens: 100,
  completionTokens: 100,
};

function stubProvider(responses: CompletionResult[]): Provider {
  let call = 0;
  const complete = vi.fn(async (): Promise<CompletionResult> => {
    const next = responses[Math.min(call, responses.length - 1)];
    call++;
    return next;
  });
  return { complete };
}

describe("validateAndAdvance: competitor analysis gating", () => {
  it("does NOT run analyze-competitors for a score below 40", async () => {
    const { validateAndAdvance } = await import("@/server/ventures/validateAndAdvance");
    const venture = await ventures.create({ title: "Weak idea", description: "a weak idea" }, { baseDir });
    const provider = stubProvider([verdictResponse(34, "kill")]);

    const result = await validateAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.verdict.score).toBe(34);
      expect(result.competitors).toBeNull();
      expect(result.venture.stage).toBe("validated");
      expect(result.venture.verdictScore).toBe(34);
    }
    // The single assertion that matters: only ONE provider call (validate-idea),
    // never a second (analyze-competitors) for a sub-40 score.
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it("DOES run analyze-competitors for a score at or above 40", async () => {
    const { validateAndAdvance } = await import("@/server/ventures/validateAndAdvance");
    const venture = await ventures.create({ title: "Decent idea", description: "a decent idea" }, { baseDir });
    const provider = stubProvider([verdictResponse(55, "refine"), competitorsResponse]);

    const result = await validateAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.competitors).not.toBeNull();
      expect(result.competitors?.crowdedness).toBe("high");
    }
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("still advances the venture even if competitor analysis itself fails", async () => {
    const { validateAndAdvance } = await import("@/server/ventures/validateAndAdvance");
    const venture = await ventures.create({ title: "Decent idea", description: "a decent idea" }, { baseDir });
    // First call succeeds (verdict), second call returns unparseable text twice
    // (both the original attempt and the gateway's one repair retry).
    const provider = stubProvider([verdictResponse(55, "refine"), { text: "not json", promptTokens: 5, completionTokens: 5 }]);

    const result = await validateAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.competitors).toBeNull();
      expect(result.venture.stage).toBe("validated"); // still advanced
    }
  });

  it("leaves the venture at captured if validate-idea itself fails", async () => {
    const { validateAndAdvance } = await import("@/server/ventures/validateAndAdvance");
    const venture = await ventures.create({ title: "Any idea", description: "any idea" }, { baseDir });
    // Both the initial attempt and the gateway's one repair retry fail to parse.
    const provider = stubProvider([{ text: "not json", promptTokens: 5, completionTokens: 5 }]);

    const result = await validateAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_output");

    const stillCaptured = await ventures.get(venture.id, { baseDir });
    expect(stillCaptured?.stage).toBe("captured");
  });
});

describe("validateAndAdvance: Decision provenance (docs/reviews/2026-07-30-stack-position.md §5.1/§6.3)", () => {
  it("records a Decision with the real model id, not the task name, for both artifacts", async () => {
    const { validateAndAdvance } = await import("@/server/ventures/validateAndAdvance");
    const artifacts = await import("@/server/db/repositories/artifacts");
    const decisions = await import("@/server/db/repositories/decisions");
    const { MODELS } = await import("@/server/ai/models");
    const { TASKS } = await import("@/server/ai/tasks");

    const venture = await ventures.create({ title: "Decent idea", description: "a decent idea" }, { baseDir });
    const provider = stubProvider([verdictResponse(55, "refine"), competitorsResponse]);

    const result = await validateAndAdvance(venture, { baseDir, provider });
    expect(result.ok).toBe(true);

    const savedArtifacts = await artifacts.listByVenture(venture.id, { baseDir });
    const validationArtifact = savedArtifacts.find((a) => a.kind === "validation")!;
    const competitorsArtifact = savedArtifacts.find((a) => a.kind === "competitors")!;

    // §6.3: Artifact.model must be the real model id, never the task name.
    expect(validationArtifact.model).toBe(MODELS[TASKS["validate-idea"].tier].id);
    expect(validationArtifact.model).not.toBe("validate-idea");

    const allDecisions = await decisions.listByVenture(venture.id, { baseDir });
    const validationDecision = allDecisions.find((d) => d.artifactId === validationArtifact.id)!;
    const competitorsDecision = allDecisions.find((d) => d.artifactId === competitorsArtifact.id)!;

    expect(validationDecision.task).toBe("validate-idea");
    expect(validationDecision.modelId).toBe(MODELS[TASKS["validate-idea"].tier].id);
    expect(validationDecision.humanVerdict).toBe("pending");
    expect(validationDecision.inputRefs).toEqual([]);

    // The competitor analysis was fed by the idea alone, not the verdict
    // artifact's content -- an honest lineage edge, not an invented one.
    expect(competitorsDecision.inputRefs).toEqual([]);
  });

  it("backfills a Decision for an artifact created before this phase existed", async () => {
    const artifacts = await import("@/server/db/repositories/artifacts");
    const decisions = await import("@/server/db/repositories/decisions");

    const venture = await ventures.create({ title: "Old venture", description: "x" }, { baseDir });
    const artifact = await artifacts.create(
      { ventureId: venture.id, kind: "validation", stage: "captured", content: {}, model: "validate-idea", costUsd: 0.02, demo: true },
      { baseDir }
    );

    const list = await decisions.listByVenture(venture.id, { baseDir });

    expect(list).toHaveLength(1);
    expect(list[0].artifactId).toBe(artifact.id);
    expect(list[0].modelId).toBe("unknown");
    expect(list[0].task).toBe("validate-idea"); // recovered from the old (mislabeled) Artifact.model
    expect(list[0].costUsd).toBe(0.02);
    expect(list[0].demo).toBe(true);
  });
});
