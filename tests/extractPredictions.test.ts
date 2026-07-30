import { describe, expect, it } from "vitest";
import type { Artifact, Plan, MvpScope } from "@/lib/domain";

function planArtifact(plan: Partial<Plan>): Artifact {
  return {
    id: "artifact-1",
    ventureId: "venture-1",
    kind: "plan",
    stage: "validated",
    content: {
      positioning: { oneLiner: "x", category: "y", wedge: "z" },
      icp: { who: "a", where: ["r/test", "hn"], currentSolution: "b", switchTrigger: "c" },
      differentiation: ["d1", "d2"],
      firstTenUsers: "e",
      successMetric: { metric: "Weekly signups", target: "25", by: "2026-09-01" },
      killCriteria: "If nobody signs up in a month, stop.",
      ...plan,
    } satisfies Plan,
    model: "plan-venture",
    costUsd: 0.01,
    demo: false,
    createdAt: "2026-07-30T00:00:00.000Z",
  };
}

describe("extractPredictions", () => {
  it("extracts a numeric, dated prediction from Plan.successMetric", async () => {
    const { extractPredictions } = await import("@/server/predictions/extractPredictions");
    const artifact = planArtifact({});

    const predictions = extractPredictions(artifact);

    expect(predictions).toHaveLength(1);
    expect(predictions[0]).toMatchObject({
      metric: "Weekly signups",
      target: 25,
      resolveBy: "2026-09-01",
      source: "plan.successMetric",
    });
    expect(predictions[0].claim).toContain("Weekly signups");
  });

  it("returns a null target when the metric's target isn't numeric (qualitative)", async () => {
    const { extractPredictions } = await import("@/server/predictions/extractPredictions");
    const artifact = planArtifact({
      successMetric: { metric: "Product-market fit", target: "clear signal", by: "2026-10-01" },
    });

    const predictions = extractPredictions(artifact);

    expect(predictions[0].target).toBeNull();
  });

  it("extracts nothing from an mvp_scope artifact -- riskiestAssumption has no resolveBy date", async () => {
    const { extractPredictions } = await import("@/server/predictions/extractPredictions");
    const artifact: Artifact = {
      id: "artifact-2",
      ventureId: "venture-1",
      kind: "mvp_scope",
      stage: "validated",
      content: {
        coreLoop: "x",
        mustHave: [{ feature: "f", why: "w" }],
        explicitlyNot: ["a", "b", "c"],
        milestones: [{ name: "n", outcome: "o", estimateDays: 3 }],
        stack: { recommendation: "r", reasoning: "why" },
        riskiestAssumption: "Nobody wants this.",
      } satisfies MvpScope,
      model: "scope-mvp",
      costUsd: 0.01,
      demo: false,
      createdAt: "2026-07-30T00:00:00.000Z",
    };

    const predictions = extractPredictions(artifact);

    expect(predictions).toEqual([]);
  });

  it("extracts nothing from a non-plan artifact kind", async () => {
    const { extractPredictions } = await import("@/server/predictions/extractPredictions");
    const artifact: Artifact = {
      id: "artifact-3",
      ventureId: "venture-1",
      kind: "validation",
      stage: "captured",
      content: { score: 50 },
      model: "validate-idea",
      costUsd: 0.01,
      demo: false,
      createdAt: "2026-07-30T00:00:00.000Z",
    };

    expect(extractPredictions(artifact)).toEqual([]);
  });
});
