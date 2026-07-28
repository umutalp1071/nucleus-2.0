import { describe, expect, it } from "vitest";
import { reconcileVerdict, VerdictSchema, type Verdict } from "@/server/ai/tasks/validate-idea";
import { FIXTURES } from "@/server/ai/fixtures";

function verdict(overrides: Partial<Verdict>): Verdict {
  return {
    score: 50,
    recommendation: "refine",
    headline: "Test headline",
    marketSize: { estimate: "$1M", confidence: "low", reasoning: "test" },
    audience: { who: "someone", painLevel: "painful" },
    risks: [
      { risk: "risk one", severity: "low" },
      { risk: "risk two", severity: "medium" },
    ],
    moat: "none",
    cheapestTest: "a landing page",
    whyNot: "it might not work",
    ...overrides,
  };
}

describe("validate-idea: fixture", () => {
  it("satisfies the schema", () => {
    const parsed = VerdictSchema.safeParse(FIXTURES["validate-idea"]);
    expect(parsed.success).toBe(true);
  });

  it("is deliberately negative -- score 34, recommendation kill", () => {
    const fixture = FIXTURES["validate-idea"] as Verdict;
    expect(fixture.score).toBe(34);
    expect(fixture.recommendation).toBe("kill");
  });

  it("has a non-empty whyNot -- the required critical argument", () => {
    const fixture = FIXTURES["validate-idea"] as Verdict;
    expect(fixture.whyNot.length).toBeGreaterThan(20);
  });
});

describe("reconcileVerdict: score band vs. self-reported recommendation", () => {
  it("leaves a correctly-banded verdict unchanged", () => {
    const v = verdict({ score: 34, recommendation: "kill" });
    expect(reconcileVerdict(v)).toEqual(v);
  });

  it("corrects a score of 38 to 'kill' even when the model said 'build'", () => {
    const v = verdict({ score: 38, recommendation: "build" });
    const fixed = reconcileVerdict(v);
    expect(fixed.recommendation).toBe("kill");
    expect(fixed.score).toBe(38); // score itself is untouched, only the label
  });

  it("corrects a score of 55 to 'refine' regardless of self-report", () => {
    expect(reconcileVerdict(verdict({ score: 55, recommendation: "build" })).recommendation).toBe("refine");
    expect(reconcileVerdict(verdict({ score: 55, recommendation: "kill" })).recommendation).toBe("refine");
  });

  it("corrects a score of 85 to 'build' even when the model said 'kill'", () => {
    const fixed = reconcileVerdict(verdict({ score: 85, recommendation: "kill" }));
    expect(fixed.recommendation).toBe("build");
  });

  it("respects the exact band boundaries: 39 kills, 40 refines, 69 refines, 70 builds", () => {
    expect(reconcileVerdict(verdict({ score: 39, recommendation: "build" })).recommendation).toBe("kill");
    expect(reconcileVerdict(verdict({ score: 40, recommendation: "kill" })).recommendation).toBe("refine");
    expect(reconcileVerdict(verdict({ score: 69, recommendation: "build" })).recommendation).toBe("refine");
    expect(reconcileVerdict(verdict({ score: 70, recommendation: "kill" })).recommendation).toBe("build");
  });
});
