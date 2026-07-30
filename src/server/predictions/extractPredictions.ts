import type { Artifact, Plan } from "@/lib/domain";

export interface ExtractedPrediction {
  claim: string;
  metric: string;
  target: number | null;
  resolveBy: string;
  source: "plan.successMetric";
}

// Pure function, no AI call -- Plan.successMetric already has
// {metric, target, by}, so paying a model to reformat data it already gave
// us would be the exact waste BACKLOG.md rejects for milestone expansion.
// See docs/reviews/2026-07-30-stack-position.md §5.2.
//
// Plan.killCriteria and MvpScope.riskiestAssumption are also falsifiable
// claims worth tracking (see the review's §3.1), but they're prose with no
// stated date -- inventing a resolveBy for them would be fabricating data
// the model never gave us, which is the exact failure mode this review
// flags elsewhere (§6.3, a provenance field that lies). Left for a future
// manual "turn this into a tracked prediction" action (Prediction.source
// already has a "user" variant for that), not auto-extracted here.
export function extractPredictions(artifact: Artifact): ExtractedPrediction[] {
  if (artifact.kind !== "plan") return [];

  const plan = artifact.content as Plan;
  const { metric, target, by } = plan.successMetric;
  const numericTarget = Number.parseFloat(target);

  return [
    {
      claim: `${metric}: ${target} by ${by}`,
      metric,
      target: Number.isNaN(numericTarget) ? null : numericTarget,
      resolveBy: by,
      source: "plan.successMetric",
    },
  ];
}
