import { describe, expect, it } from "vitest";
import { isApproaching } from "@/lib/budgetStatus";

const caps = { daily: 10, weekly: 30, monthly: 50 };

describe("isApproaching", () => {
  it("is false well within every cap", () => {
    expect(isApproaching({ daily: 1, weekly: 3, monthly: 5 }, caps)).toBe(false);
  });

  it("is true right at the 80% threshold on any single window", () => {
    expect(isApproaching({ daily: 8, weekly: 3, monthly: 5 }, caps)).toBe(true);
    expect(isApproaching({ daily: 1, weekly: 24, monthly: 5 }, caps)).toBe(true);
    expect(isApproaching({ daily: 1, weekly: 3, monthly: 40 }, caps)).toBe(true);
  });

  it("is false just under the threshold", () => {
    expect(isApproaching({ daily: 7.9, weekly: 3, monthly: 5 }, caps)).toBe(false);
  });
});
