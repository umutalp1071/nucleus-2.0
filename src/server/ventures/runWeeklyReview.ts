import * as artifactsRepo from "../db/repositories/artifacts";
import * as observationsRepo from "../db/repositories/observations";
import * as eventsRepo from "../db/repositories/events";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { recordDecision } from "./recordDecision";
import type { Venture, Plan, WeeklyReview, Artifact } from "@/lib/domain";

export type RunWeeklyReviewResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Summarizes the last 7 days of this venture's own Observations and events
// against the kill criteria set at planning time. Manual trigger only, no
// cron. See docs/plan/PHASE-09-growth-stage.md.
export async function runWeeklyReview(venture: Venture, opts?: Opts): Promise<RunWeeklyReviewResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const planArtifact = await artifactsRepo.latestOfKind(venture.id, "plan", repoOpts);
  const killCriteria = planArtifact ? (planArtifact.content as Plan).killCriteria : "No kill criteria on file yet.";

  const since = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();
  const [allObservations, allEvents] = await Promise.all([
    observationsRepo.listByVenture(venture.id, repoOpts),
    eventsRepo.list(500, repoOpts),
  ]);
  const observations = allObservations.filter((o) => o.observedAt >= since);
  const events = allEvents.filter((e) => e.ventureId === venture.id && e.createdAt >= since);

  const result = await runTask<WeeklyReview>(
    "weekly-review",
    { ventureTitle: venture.title, killCriteria, observations, events },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "weekly_review",
      stage: venture.stage,
      content: result.data,
      model: result.modelId,
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  await recordDecision(
    { task: "weekly-review", artifact, inputRefs: planArtifact ? [planArtifact.id] : [], result },
    repoOpts
  );
  return { ok: true, artifact };
}
