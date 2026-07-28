import * as ventures from "../db/repositories/ventures";
import * as artifactsRepo from "../db/repositories/artifacts";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { recordEvent } from "../events";
import type { Venture, Plan, MvpScope, Verdict, Competitors } from "@/lib/domain";

export type PlanAndAdvanceResult =
  | { ok: true; venture: Venture; plan: Plan; mvpScope: MvpScope; demo: boolean }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Runs plan-venture, then scope-mvp, then advances validated -> planned.
// If the second call fails, the first artifact (the plan) is already saved
// and the venture stays at validated -- partial progress the user paid for
// is never discarded. See docs/plan/PHASE-06-planning-stage.md.
export async function planAndAdvance(venture: Venture, opts?: Opts): Promise<PlanAndAdvanceResult> {
  const [validationArtifact, competitorsArtifact] = await Promise.all([
    artifactsRepo.latestOfKind(venture.id, "validation", { baseDir: opts?.baseDir }),
    artifactsRepo.latestOfKind(venture.id, "competitors", { baseDir: opts?.baseDir }),
  ]);

  const planResult = await runTask<Plan>(
    "plan-venture",
    {
      idea: venture.description,
      verdict: (validationArtifact?.content as Verdict) ?? null,
      competitors: (competitorsArtifact?.content as Competitors) ?? null,
    },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!planResult.ok) return planResult;

  await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "plan",
      stage: "validated",
      content: planResult.data,
      model: "plan-venture",
      costUsd: planResult.costUsd,
      demo: planResult.demo,
    },
    { baseDir: opts?.baseDir }
  );
  await recordEvent("venture.planned", `Planned "${venture.title}" -- ${planResult.data.positioning.oneLiner}`, {
    ventureId: venture.id,
    baseDir: opts?.baseDir,
  });

  const mvpResult = await runTask<MvpScope>(
    "scope-mvp",
    { idea: venture.description, plan: planResult.data },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!mvpResult.ok) return mvpResult;

  await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "mvp_scope",
      stage: "validated",
      content: mvpResult.data,
      model: "scope-mvp",
      costUsd: mvpResult.costUsd,
      demo: mvpResult.demo,
    },
    { baseDir: opts?.baseDir }
  );
  await recordEvent(
    "venture.scoped",
    `Scoped MVP for "${venture.title}" -- ${mvpResult.data.milestones.length} milestones.`,
    { ventureId: venture.id, baseDir: opts?.baseDir }
  );

  const updated = await ventures.advance(venture.id, "planned", { baseDir: opts?.baseDir });

  return {
    ok: true,
    venture: updated,
    plan: planResult.data,
    mvpScope: mvpResult.data,
    demo: planResult.demo || mvpResult.demo,
  };
}
