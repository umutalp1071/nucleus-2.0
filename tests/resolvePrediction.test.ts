import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let opts: { baseDir: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-resolve-prediction-test-"));
  opts = { baseDir: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("resolvePrediction", () => {
  it("resolves to hit when the observed value meets the target", async () => {
    const { resolvePrediction } = await import("@/server/ventures/resolvePrediction");
    const predictions = await import("@/server/db/repositories/predictions");
    const observations = await import("@/server/db/repositories/observations");

    const prediction = await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "25 WAU by 6 weeks", metric: "Weekly active users", target: 25, resolveBy: "2026-09-01", source: "plan.successMetric", status: "open", resolvedAt: null, resolvedBy: null },
      opts
    );
    const observation = await observations.create(
      { ventureId: "v1", observedAt: "2026-08-20", metric: "Weekly active users", value: 30, note: null, source: "manual" },
      opts
    );

    const result = await resolvePrediction(prediction.id, observation.id, opts);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prediction.status).toBe("hit");
      expect(result.prediction.resolvedBy).toBe(observation.id);
    }
  });

  it("resolves to missed when the observed value falls short of the target", async () => {
    const { resolvePrediction } = await import("@/server/ventures/resolvePrediction");
    const predictions = await import("@/server/db/repositories/predictions");
    const observations = await import("@/server/db/repositories/observations");

    const prediction = await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "c", metric: "m", target: 25, resolveBy: "2026-09-01", source: "plan.successMetric", status: "open", resolvedAt: null, resolvedBy: null },
      opts
    );
    const observation = await observations.create(
      { ventureId: "v1", observedAt: "2026-08-20", metric: "m", value: 10, note: null, source: "manual" },
      opts
    );

    const result = await resolvePrediction(prediction.id, observation.id, opts);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.prediction.status).toBe("missed");
  });

  it("rejects resolving against an observation with a different metric", async () => {
    const { resolvePrediction } = await import("@/server/ventures/resolvePrediction");
    const predictions = await import("@/server/db/repositories/predictions");
    const observations = await import("@/server/db/repositories/observations");

    const prediction = await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "c", metric: "Weekly active users", target: 25, resolveBy: "2026-09-01", source: "plan.successMetric", status: "open", resolvedAt: null, resolvedBy: null },
      opts
    );
    const observation = await observations.create(
      { ventureId: "v1", observedAt: "2026-08-20", metric: "Revenue", value: 100, note: null, source: "manual" },
      opts
    );

    const result = await resolvePrediction(prediction.id, observation.id, opts);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("metric_mismatch");
  });

  it("returns not_found for an unknown prediction or observation id", async () => {
    const { resolvePrediction } = await import("@/server/ventures/resolvePrediction");
    const observations = await import("@/server/db/repositories/observations");
    const observation = await observations.create(
      { ventureId: "v1", observedAt: "2026-08-20", metric: "m", value: 1, note: null, source: "manual" },
      opts
    );

    const result = await resolvePrediction("missing", observation.id, opts);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });
});
