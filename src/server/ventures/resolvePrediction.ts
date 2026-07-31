import * as predictionsRepo from "../db/repositories/predictions";
import * as observationsRepo from "../db/repositories/observations";
import type { Prediction } from "@/lib/domain";

export type ResolvePredictionResult =
  | { ok: true; prediction: Prediction }
  | { ok: false; reason: "not_found" | "metric_mismatch"; message: string };

// Resolving is a join, not a human squinting at a chart -- an Observation
// whose `metric` matches the Prediction's `metric` decides hit/missed/void.
// `void` covers the case where either side has no number to compare (a
// note-only Observation, or a Prediction with no numeric target). See
// docs/plan/PHASE-09-growth-stage.md.
export async function resolvePrediction(
  predictionId: string,
  observationId: string,
  opts?: { baseDir?: string }
): Promise<ResolvePredictionResult> {
  const prediction = await predictionsRepo.get(predictionId, opts);
  if (!prediction) return { ok: false, reason: "not_found", message: "That prediction doesn't exist." };

  const observation = await observationsRepo.get(observationId, opts);
  if (!observation) return { ok: false, reason: "not_found", message: "That observation doesn't exist." };

  if (observation.metric !== prediction.metric) {
    return { ok: false, reason: "metric_mismatch", message: "That entry doesn't track the same metric as this prediction." };
  }

  const status =
    observation.value === null || prediction.target === null
      ? "void"
      : observation.value >= prediction.target
      ? "hit"
      : "missed";

  const resolved = await predictionsRepo.resolve(prediction.id, status, observation.id, opts);
  return { ok: true, prediction: resolved };
}
