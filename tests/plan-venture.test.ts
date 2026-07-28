import { describe, expect, it } from "vitest";
import { PlanSchema, MvpScopeSchema, type Plan, type MvpScope } from "@/lib/domain";
import { FIXTURES } from "@/server/ai/fixtures";

function validPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    positioning: { oneLiner: "X for Y who Z", category: "test", wedge: "test wedge" },
    icp: { who: "someone", where: ["r/test", "a test forum"], currentSolution: "spreadsheet", switchTrigger: "friction" },
    differentiation: ["simpler", "cheaper"],
    firstTenUsers: "post in the two channels above",
    successMetric: { metric: "signups", target: "10", by: "1 month" },
    killCriteria: "if nobody returns in week 2",
    ...overrides,
  };
}

function validMvpScope(overrides: Partial<MvpScope> = {}): MvpScope {
  return {
    coreLoop: "capture then review",
    mustHave: [{ feature: "capture", why: "core value" }],
    explicitlyNot: ["teams", "mobile app", "integrations"],
    milestones: [
      { name: "m1", outcome: "o1", estimateDays: 3 },
      { name: "m2", outcome: "o2", estimateDays: 5 },
      { name: "m3", outcome: "o3", estimateDays: 7 },
    ],
    stack: { recommendation: "Next.js", reasoning: "fast to ship" },
    riskiestAssumption: "that anyone wants this",
    ...overrides,
  };
}

describe("plan-venture: fixture", () => {
  it("satisfies PlanSchema", () => {
    expect(PlanSchema.safeParse(FIXTURES["plan-venture"]).success).toBe(true);
  });

  it("has a non-trivial killCriteria", () => {
    const fixture = FIXTURES["plan-venture"] as Plan;
    expect(fixture.killCriteria.length).toBeGreaterThan(15);
  });

  it("where contains concrete named channels, not generic placeholders", () => {
    const fixture = FIXTURES["plan-venture"] as Plan;
    for (const channel of fixture.icp.where) {
      expect(channel.toLowerCase()).not.toBe("social media");
      expect(channel.toLowerCase()).not.toBe("online communities");
    }
  });
});

describe("PlanSchema: field caps", () => {
  it("rejects fewer than 2 differentiation points", () => {
    expect(PlanSchema.safeParse(validPlan({ differentiation: ["only one"] })).success).toBe(false);
  });

  it("rejects more than 4 differentiation points", () => {
    const five = ["a", "b", "c", "d", "e"];
    expect(PlanSchema.safeParse(validPlan({ differentiation: five })).success).toBe(false);
  });

  it("rejects a oneLiner over 140 characters", () => {
    const long = "x".repeat(141);
    expect(
      PlanSchema.safeParse(validPlan({ positioning: { oneLiner: long, category: "c", wedge: "w" } })).success
    ).toBe(false);
  });

  it("rejects fewer than 2 'where' channels", () => {
    expect(
      PlanSchema.safeParse(
        validPlan({ icp: { who: "x", where: ["only one"], currentSolution: "x", switchTrigger: "x" } })
      ).success
    ).toBe(false);
  });
});

describe("scope-mvp: fixture", () => {
  it("satisfies MvpScopeSchema", () => {
    expect(MvpScopeSchema.safeParse(FIXTURES["scope-mvp"]).success).toBe(true);
  });
});

describe("MvpScopeSchema: field caps", () => {
  it("rejects 7 mustHave entries -- the cap is 5", () => {
    const sevenFeatures = Array.from({ length: 7 }, (_, i) => ({ feature: `f${i}`, why: `why${i}` }));
    expect(MvpScopeSchema.safeParse(validMvpScope({ mustHave: sevenFeatures })).success).toBe(false);
  });

  it("accepts exactly 5 mustHave entries", () => {
    const fiveFeatures = Array.from({ length: 5 }, (_, i) => ({ feature: `f${i}`, why: `why${i}` }));
    expect(MvpScopeSchema.safeParse(validMvpScope({ mustHave: fiveFeatures })).success).toBe(true);
  });

  it("rejects fewer than 3 explicitlyNot entries -- the cuts are the scope", () => {
    expect(MvpScopeSchema.safeParse(validMvpScope({ explicitlyNot: ["only", "two"] })).success).toBe(false);
  });

  it("rejects a milestone longer than 14 days", () => {
    expect(
      MvpScopeSchema.safeParse(
        validMvpScope({ milestones: [{ name: "too long", outcome: "o", estimateDays: 15 }] })
      ).success
    ).toBe(false);
  });

  it("rejects fewer than 3 milestones", () => {
    expect(
      MvpScopeSchema.safeParse(
        validMvpScope({ milestones: [{ name: "m1", outcome: "o1", estimateDays: 3 }] })
      ).success
    ).toBe(false);
  });

  it("rejects more than 6 milestones", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `m${i}`, outcome: `o${i}`, estimateDays: 3 }));
    expect(MvpScopeSchema.safeParse(validMvpScope({ milestones: seven })).success).toBe(false);
  });
});
