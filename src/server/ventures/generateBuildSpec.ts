import * as artifactsRepo from "../db/repositories/artifacts";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import type { Venture, Plan, MvpScope, BuildSpec, Artifact } from "@/lib/domain";

export type GenerateBuildSpecResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Generates the handoff spec from the venture's plan + MVP scope. Each call
// is a normal budgeted gateway call, versioned by createdAt like every other
// artifact -- regenerating never overwrites a previous spec. See
// docs/plan/PHASE-07-build-stage.md.
export async function generateBuildSpec(venture: Venture, opts?: Opts): Promise<GenerateBuildSpecResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const [planArtifact, mvpArtifact] = await Promise.all([
    artifactsRepo.latestOfKind(venture.id, "plan", repoOpts),
    artifactsRepo.latestOfKind(venture.id, "mvp_scope", repoOpts),
  ]);
  if (!planArtifact || !mvpArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs a plan and an MVP scope before it can write a build spec.",
    };
  }

  const result = await runTask<BuildSpec>(
    "generate-build-spec",
    {
      idea: venture.description,
      plan: planArtifact.content as Plan,
      mvpScope: mvpArtifact.content as MvpScope,
    },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "build_spec",
      stage: venture.stage,
      content: result.data,
      model: "generate-build-spec",
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  return { ok: true, artifact };
}
