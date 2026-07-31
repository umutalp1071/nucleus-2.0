import * as artifactsRepo from "../db/repositories/artifacts";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { recordDecision } from "./recordDecision";
import type { Venture, Calendar, PostDraft, Artifact } from "@/lib/domain";

export type GeneratePostResult =
  | { ok: true; artifact: Artifact }
  | {
      ok: false;
      reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite" | "not_found";
      message: string;
    };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Expands exactly one calendar row into a finished draft -- one AI call, not
// twelve. day/channel/hook/angle/type are copied from the calendar entry,
// never re-generated. See docs/plan/PHASE-09-growth-stage.md.
export async function generatePost(venture: Venture, day: number, opts?: Opts): Promise<GeneratePostResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const calendarArtifact = await artifactsRepo.latestOfKind(venture.id, "content_calendar", repoOpts);
  if (!calendarArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs a content calendar before it can write a post.",
    };
  }

  const calendar = calendarArtifact.content as Calendar;
  const entry = calendar.posts.find((p) => p.day === day);
  if (!entry) {
    return { ok: false, reason: "not_found", message: "That calendar entry doesn't exist." };
  }

  const result = await runTask<PostDraft>(
    "write-post",
    { idea: venture.description, channel: entry.channel, angle: entry.angle, hook: entry.hook, type: entry.type },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!result.ok) return result;

  const artifact = await artifactsRepo.create(
    {
      ventureId: venture.id,
      kind: "content_post",
      stage: venture.stage,
      content: { ...entry, draft: result.data.draft },
      model: result.modelId,
      costUsd: result.costUsd,
      demo: result.demo,
    },
    repoOpts
  );
  await recordDecision(
    { task: "write-post", artifact, inputRefs: [calendarArtifact.id], result },
    repoOpts
  );
  return { ok: true, artifact };
}
