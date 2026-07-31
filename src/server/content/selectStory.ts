import type { NucleusEvent, Prediction } from "@/lib/domain";

// Not every event is a story. A pure, no-AI scoring function -- it's the
// editorial judgement that silently degrades if left untested, so it's
// TDD'd. See docs/plan/PHASE-10-buildinpublic-engine.md.
const WEIGHT = {
  // A killed verdict, or a Prediction resolved missed -- "we predicted X, we
  // got Y" is the most shareable content type this system produces.
  highest: 100,
  // A stage transition, a fired budget guard, or a live deploy -- all
  // genuinely interesting engineering/product events.
  high: 70,
} as const;

function scoreEvent(event: NucleusEvent): number {
  if (event.type === "venture.advanced") {
    const payload = event.payload as { to?: string } | undefined;
    return payload?.to === "killed" ? WEIGHT.highest : WEIGHT.high;
  }
  if (event.type === "budget.blocked" || event.type === "venture.deployed") {
    return WEIGHT.high;
  }
  // Routine CRUD (venture.created, venture.validated, venture.planned, ...)
  // scores zero -- these duplicate the richer venture.advanced signal for
  // the same transition, or aren't a story on their own.
  return 0;
}

function missedPredictionAsEvent(p: Prediction): NucleusEvent {
  return {
    id: `prediction-${p.id}`,
    ventureId: p.ventureId,
    type: "prediction.missed",
    summary: `Predicted "${p.claim}" -- missed.`,
    payload: { prediction: p },
    createdAt: p.resolvedAt ?? p.createdAt,
  };
}

// Returns the top-N storyworthy events in the given window, highest score
// first (ties broken newest-first). Callers decide the window (which events
// and predictions are "recent") -- this function only scores and ranks.
export function selectStory(events: NucleusEvent[], predictions: Prediction[], limit = 5): NucleusEvent[] {
  const missed = predictions.filter((p) => p.status === "missed").map(missedPredictionAsEvent);
  const scored = [...events, ...missed].map((e) => ({
    event: e,
    score: e.type === "prediction.missed" ? WEIGHT.highest : scoreEvent(e),
  }));

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.event.createdAt.localeCompare(a.event.createdAt))
    .slice(0, limit)
    .map((s) => s.event);
}
