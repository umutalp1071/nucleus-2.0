import { describe, it, expect } from "vitest";
import { computeMetrics, stdDev, band, type IdeaResult } from "./score";

function r(
  id: string,
  actualOutcome: IdeaResult["actualOutcome"],
  scores: number[],
  contamination: IdeaResult["contamination"] = "low"
): IdeaResult {
  return {
    id,
    actualOutcome,
    contamination,
    scores,
    recommendation: band(scores[0]),
  };
}

describe("band", () => {
  it("matches the product's score bands at the boundaries", () => {
    expect(band(0)).toBe("kill");
    expect(band(39)).toBe("kill");
    expect(band(40)).toBe("refine");
    expect(band(69)).toBe("refine");
    expect(band(70)).toBe("build");
    expect(band(100)).toBe("build");
  });
});

describe("stdDev", () => {
  it("is 0 for a single run", () => {
    expect(stdDev([50])).toBe(0);
  });

  it("is 0 for identical runs -- the cached-response failure mode", () => {
    expect(stdDev([50, 50, 50])).toBe(0);
  });

  it("grows with spread", () => {
    expect(stdDev([40, 60])).toBe(10);
    expect(stdDev([20, 80])).toBe(30);
  });
});

describe("computeMetrics", () => {
  it("excludes unknown outcomes from calibration and precision", () => {
    const m = computeMetrics([
      r("a", "succeeded", [80]),
      r("b", "unknown", [80]),
      r("c", "unknown", [10]),
    ]);
    expect(m.calibrationN).toBe(1);
    expect(m.calibration).toBe(1);
    expect(m.killPrecisionN).toBe(0);
    expect(m.killPrecision).toBeNull();
    // ...but unknowns still count toward stability, which needs no label.
    expect(m.n).toBe(3);
  });

  it("computes calibration over ideas scoring 70 or above", () => {
    const m = computeMetrics([
      r("a", "succeeded", [85]),
      r("b", "succeeded", [75]),
      r("c", "failed", [90]),
      r("d", "failed", [30]), // below the band, not counted
    ]);
    expect(m.calibrationN).toBe(3);
    expect(m.calibration).toBeCloseTo(2 / 3);
  });

  it("computes kill precision over killed ideas", () => {
    const m = computeMetrics([
      r("a", "failed", [20]),
      r("b", "failed", [35]),
      r("c", "succeeded", [15]), // a false kill
      r("d", "succeeded", [80]),
    ]);
    expect(m.killPrecisionN).toBe(3);
    expect(m.killPrecision).toBeCloseTo(2 / 3);
  });

  it("catches the never-kill gaming strategy via falseKillRate", () => {
    // A validator that never kills anything has perfect (null) kill
    // precision and a 0% false kill rate -- but scores every real dud as
    // build, which calibration then punishes. The three numbers together
    // have no cheap winning strategy; that is the point of reporting all
    // three.
    const neverKills = computeMetrics([
      r("a", "failed", [75]),
      r("b", "failed", [75]),
      r("c", "succeeded", [75]),
    ]);
    expect(neverKills.killPrecision).toBeNull();
    expect(neverKills.falseKillRate).toBe(0);
    expect(neverKills.calibration).toBeCloseTo(1 / 3); // punished here

    const killsEverything = computeMetrics([
      r("a", "failed", [10]),
      r("b", "failed", [10]),
      r("c", "succeeded", [10]),
    ]);
    expect(killsEverything.killPrecision).toBeCloseTo(2 / 3);
    expect(killsEverything.falseKillRate).toBe(1); // punished here
    expect(killsEverything.calibration).toBeNull();
  });

  it("reports null stability for a single-run eval rather than a fake 0", () => {
    const m = computeMetrics([r("a", "succeeded", [80])]);
    expect(m.meanScoreStdDev).toBeNull();
    expect(m.maxScoreStdDev).toBeNull();
  });

  it("flags ideas whose band flipped between runs", () => {
    const m = computeMetrics([
      r("stable", "succeeded", [72, 74, 71]),
      r("flipper", "failed", [38, 55, 41]), // kill -> refine -> refine
    ]);
    expect(m.bandFlips).toEqual(["flipper"]);
  });

  it("surfaces the worst offender, not just the average, in stability", () => {
    const m = computeMetrics([
      r("a", "succeeded", [50, 50]),
      r("b", "succeeded", [50, 50]),
      r("c", "failed", [20, 80]),
    ]);
    expect(m.maxScoreStdDev).toBe(30);
    expect(m.meanScoreStdDev).toBeCloseTo(10);
  });
});
