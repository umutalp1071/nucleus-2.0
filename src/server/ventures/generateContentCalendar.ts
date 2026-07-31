import * as artifactsRepo from "../db/repositories/artifacts";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { recordDecision } from "./recordDecision";
import type { Venture, Plan, Calendar, Artifact } from "@/lib/domain";

export type GenerateContentCalendarResult =
  | { ok: true; artifact: Artifact }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Generates the 4-week content calendar from the venture's plan. The model's
// channels are re-checked against the plan's actual ICP `where` list here --
// a generic advice calendar that ignores the audience research is worthless,
// and a static zod schema has no way to see the call's own input to enforce
// that. See docs/plan/PHASE-09-growth-stage.md.
export async function generateContentCalendar(venture: Venture, opts?: Opts): Promise<GenerateContentCalendarResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const planArtifact = await artifactsRepo.latestOfKind(venture.id, "plan", repoOpts);
  if (!planArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs a plan before it can write a content calendar.",
    };
  }
  const plan = planArtifact.content as Plan;

  const result = await runTask<Calendar>(
    "write-content-calendar",
    { idea: venture.description, plan },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const allowedChannels = new Set(plan.icp.where);
  const channelsValid =
    result.data.channels.every((c) => allowedChannels.has(c.channel)) &&
    result.data.posts.every((p) => allowedChannels.has(p.channel));
  if (!channelsValid) {
    return { ok: false, reason: "invalid_output", message: "Nucleus couldn't make sense of that result. Try again." };
  }

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "content_calendar",
      stage: venture.stage,
      content: result.data,
      model: result.modelId,
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  await recordDecision(
    { task: "write-content-calendar", artifact, inputRefs: [planArtifact.id], result },
    repoOpts
  );
  return { ok: true, artifact };
}
