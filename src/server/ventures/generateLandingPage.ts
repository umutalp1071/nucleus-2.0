import * as artifactsRepo from "../db/repositories/artifacts";
import * as decisionsRepo from "../db/repositories/decisions";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { recordDecision } from "./recordDecision";
import type { Venture, Plan, Landing, Artifact } from "@/lib/domain";

export type GenerateLandingPageResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
  feedback?: string;
}

// Generates the landing page's structured copy from the venture's plan. Each
// call is a normal budgeted gateway call, versioned by createdAt like every
// other artifact -- regenerating never overwrites a previous version. See
// docs/plan/PHASE-08-launch-stage.md.
export async function generateLandingPage(venture: Venture, opts?: Opts): Promise<GenerateLandingPageResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const planArtifact = await artifactsRepo.latestOfKind(venture.id, "plan", repoOpts);
  if (!planArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs a plan before it can write landing page copy.",
    };
  }

  // Fetched before the new artifact exists -- this is the version the
  // founder is unhappy with when `feedback` is set, so its Decision is what
  // gets annotated below. See docs/reviews/2026-07-30-stack-position.md §5.4.
  const previousLandingArtifact = opts?.feedback
    ? await artifactsRepo.latestOfKind(venture.id, "landing_page", repoOpts)
    : null;

  const result = await runTask<Landing>(
    "write-landing-page",
    { idea: venture.description, plan: planArtifact.content as Plan, feedback: opts?.feedback },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "landing_page",
      stage: venture.stage,
      content: result.data,
      model: result.modelId,
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  await recordDecision(
    { task: "write-landing-page", artifact, inputRefs: [planArtifact.id], result },
    repoOpts
  );
  if (previousLandingArtifact) {
    await decisionsRepo.markHumanFeedback(previousLandingArtifact.id, "regenerated", opts!.feedback!, repoOpts);
  }
  return { ok: true, artifact };
}
