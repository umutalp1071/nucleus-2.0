import { describe, expect, it } from "vitest";
import { MODELS, TIER_ORDER, estimateCost, actualCost, type Tier } from "@/server/ai/models";

describe("model pricing", () => {
  it("actualCost computes known dollar amounts from known token counts", () => {
    // mid tier: $1.00/M in, $5.00/M out
    const cost = actualCost("mid", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(1.0 + 5.0, 6);
  });

  it("actualCost is zero for zero tokens", () => {
    expect(actualCost("cheap", 0, 0)).toBe(0);
  });

  it("every tier has a distinct model id and TIER_ORDER lists all three", () => {
    expect(TIER_ORDER).toEqual(["cheap", "mid", "frontier"]);
    const ids = TIER_ORDER.map((t) => MODELS[t].id);
    expect(new Set(ids).size).toBe(3);
  });

  it("frontier costs more per token than mid, which costs more than cheap", () => {
    expect(MODELS.frontier.inUsdPerM).toBeGreaterThan(MODELS.mid.inUsdPerM);
    expect(MODELS.mid.inUsdPerM).toBeGreaterThan(MODELS.cheap.inUsdPerM);
  });

  it("estimateCost never returns less than actualCost for the same token counts", () => {
    const tiers: Tier[] = ["cheap", "mid", "frontier"];
    for (const tier of tiers) {
      for (const inTok of [0, 1, 100, 12345]) {
        for (const outTok of [0, 50, 900]) {
          const promptChars = inTok * 4; // exact case: estimate should equal actual
          const estimate = estimateCost(tier, promptChars, outTok);
          const actual = actualCost(tier, inTok, outTok);
          expect(estimate).toBeGreaterThanOrEqual(actual);
        }
      }
    }
  });

  it("estimateCost rounds fractional character counts up, never down", () => {
    // 401 chars is not evenly divisible by 4 -> must round the token count UP,
    // so the estimate must exceed the cost of the exact 100-token case.
    const exact = estimateCost("mid", 400, 900);
    const fractional = estimateCost("mid", 401, 900);
    expect(fractional).toBeGreaterThan(exact);
  });
});
