import * as artifactsRepo from "../db/repositories/artifacts";
import * as decisionsRepo from "../db/repositories/decisions";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { generateLandingPage } from "./generateLandingPage";
import { recordDecision } from "./recordDecision";
import type { Venture, Plan, MvpScope, Verdict, Competitors, Artifact } from "@/lib/domain";

export type RegenerateResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Regenerates a plan or mvp_scope artifact with the founder's feedback
// appended to the prompt. The PREVIOUS artifact is never overwritten --
// versioned by createdAt, so a regeneration is a normal budgeted gateway
// call, not a special path. See docs/plan/PHASE-06-planning-stage.md.
export async function regenerateArtifact(
  venture: Venture,
  kind: "plan" | "mvp_scope" | "landing_page",
  feedback: string,
  opts?: Opts
): Promise<RegenerateResult> {
  const repoOpts = { baseDir: opts?.baseDir };

  if (kind === "landing_page") {
    return generateLandingPage(venture, { baseDir: opts?.baseDir, provider: opts?.provider, feedback });
  }

  if (kind === "plan") {
    const [validationArtifact, competitorsArtifact, previousPlanArtifact] = await Promise.all([
      artifactsRepo.latestOfKind(venture.id, "validation", repoOpts),
      artifactsRepo.latestOfKind(venture.id, "competitors", repoOpts),
      artifactsRepo.latestOfKind(venture.id, "plan", repoOpts),
    ]);

    const result = await runTask<Plan>(
      "plan-venture",
      {
        idea: venture.description,
        verdict: (validationArtifact?.content as Verdict) ?? null,
        competitors: (competitorsArtifact?.content as Competitors) ?? null,
        feedback,
      },
      { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
    );
    if (!result.ok) return result;

    const inputRefs = [validationArtifact?.id, competitorsArtifact?.id].filter(
      (id): id is string => Boolean(id)
    );
    const artifact = await artifactsRepo.create(
      {
        ventureId: venture.id,
        kind: "plan",
        stage: venture.stage,
        content: result.data,
        model: result.modelId,
        costUsd: result.costUsd,
        demo: result.demo,
      },
      repoOpts
    );
    await recordDecision({ task: "plan-venture", artifact, inputRefs, result }, repoOpts);
    if (previousPlanArtifact) {
      await decisionsRepo.markHumanFeedback(previousPlanArtifact.id, "regenerated", feedback, repoOpts);
    }
    return { ok: true, artifact };
  }

  // kind === "mvp_scope"
  const [planArtifact, previousMvpArtifact] = await Promise.all([
    artifactsRepo.latestOfKind(venture.id, "plan", repoOpts),
    artifactsRepo.latestOfKind(venture.id, "mvp_scope", repoOpts),
  ]);
  if (!planArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs a plan before it can scope an MVP. Generate the plan first.",
    };
  }

  const result = await runTask<MvpScope>(
    "scope-mvp",
    { idea: venture.description, plan: planArtifact.content as Plan, feedback },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "mvp_scope",
      stage: venture.stage,
      content: result.data,
      model: result.modelId,
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  await recordDecision({ task: "scope-mvp", artifact, inputRefs: [planArtifact.id], result }, repoOpts);
  if (previousMvpArtifact) {
    await decisionsRepo.markHumanFeedback(previousMvpArtifact.id, "regenerated", feedback, repoOpts);
  }
  return { ok: true, artifact };
}
