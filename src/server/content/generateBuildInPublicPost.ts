import * as ventures from "../db/repositories/ventures";
import * as eventsRepo from "../db/repositories/events";
import * as predictionsRepo from "../db/repositories/predictions";
import { readRepoFile, writeRepoFile } from "../db/store";
import { runTask } from "../ai/gateway";
import type { Provider } from "../ai/provider";
import { selectStory } from "./selectStory";
import { recentCommits } from "./git";
import { loadVoiceAndRejections } from "./drafts";
import { renderBuildInPublicPost, draftFilename } from "./renderBuildInPublicPost";
import type { BuildInPublicPost } from "@/lib/domain";

export type Subject = { mode: "venture"; ventureId: string } | { mode: "self" };

export type GenerateBuildInPublicPostResult =
  | { ok: true; filename: string; post: BuildInPublicPost }
  | {
      ok: false;
      reason: "budget_exceeded" | "invalid_output" | "provider_error" | "no_story" | "not_found";
      message: string;
    };

interface Opts {
  baseDir?: string;
  repoRoot?: string;
  provider?: Provider;
}

function extractPhaseCompletions(progressMd: string): string {
  return progressMd
    .split("\n")
    .filter((line) => /^\|\s*\S+\s*\|.*✅ done/.test(line))
    .join("\n");
}

function firstLearningEntry(learningMd: string): string {
  const lines = learningMd.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## "));
  if (start === -1) return "";
  const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines.slice(start, end === -1 ? undefined : end).join("\n").trim();
}

async function buildNarrative(subject: Subject, opts?: Opts): Promise<{ subjectLabel: string; narrative: string }> {
  if (subject.mode === "venture") {
    const venture = await ventures.get(subject.ventureId, { baseDir: opts?.baseDir });
    if (!venture) return { subjectLabel: "", narrative: "" };

    const [allEvents, predictions] = await Promise.all([
      eventsRepo.list(500, { baseDir: opts?.baseDir }),
      predictionsRepo.listByVenture(venture.id, { baseDir: opts?.baseDir }),
    ]);
    const events = allEvents.filter((e) => e.ventureId === venture.id);
    const story = selectStory(events, predictions);
    const narrative = story.map((e) => `- ${e.type}: ${e.summary}`).join("\n");
    return { subjectLabel: venture.title, narrative };
  }

  const commits = recentCommits({ cwd: opts?.repoRoot });
  const progressMd = (await readRepoFile("docs/plan/PROGRESS.md", { repoRoot: opts?.repoRoot })) ?? "";
  const learningMd = (await readRepoFile("docs/workflow/learning.md", { repoRoot: opts?.repoRoot })) ?? "";
  const parts = [
    commits.length ? `Recent commits:\n${commits.join("\n")}` : "",
    extractPhaseCompletions(progressMd) ? `Phases completed so far:\n${extractPhaseCompletions(progressMd)}` : "",
    firstLearningEntry(learningMd) ? `Most recent development log entry:\n${firstLearningEntry(learningMd)}` : "",
  ].filter(Boolean);
  return { subjectLabel: "Nucleus itself", narrative: parts.join("\n\n") };
}

function defaultVisual(subject: Subject): string {
  if (subject.mode === "venture") {
    return `**Type:** Screenshot\n\nCapture the venture workspace at \`/ventures/${subject.ventureId}\`, showing the artifact or panel the post above describes.`;
  }
  return `**Type:** Terminal screenshot\n\nRun \`git log --oneline -10\` in the project root and capture the output, or screenshot the dashboard homepage.`;
}

// Generates one build-in-public draft: a venture's own recent activity, or
// (self mode) Nucleus's own git log / PROGRESS.md / learning.md -- the
// dogfooding path. Writes a markdown file straight into the tracked
// docs/content/drafts/ tree; no Artifact/Decision is recorded, since this
// isn't part of a venture's artifact pipeline. See
// docs/plan/PHASE-10-buildinpublic-engine.md.
export async function generateBuildInPublicPost(subject: Subject, opts?: Opts): Promise<GenerateBuildInPublicPostResult> {
  if (subject.mode === "venture") {
    const venture = await ventures.get(subject.ventureId, { baseDir: opts?.baseDir });
    if (!venture) return { ok: false, reason: "not_found", message: "Venture not found." };
  }

  const { subjectLabel, narrative } = await buildNarrative(subject, opts);
  if (!narrative) {
    return { ok: false, reason: "no_story", message: "Nothing worth writing about yet." };
  }

  const { voiceSamples, rejectedReasons } = await loadVoiceAndRejections(opts);

  const result = await runTask<BuildInPublicPost>(
    "write-buildinpublic",
    {
      subject: subjectLabel,
      narrative,
      voiceSamples,
      rejectedReasons,
      selfDocumentation: subject.mode === "self",
    },
    {
      ventureId: subject.mode === "venture" ? subject.ventureId : undefined,
      baseDir: opts?.baseDir,
      provider: opts?.provider,
    }
  );
  if (!result.ok) return result;

  const filename = draftFilename(result.data);
  const content = renderBuildInPublicPost(result.data, defaultVisual(subject));
  await writeRepoFile(`docs/content/drafts/${filename}`, content, { repoRoot: opts?.repoRoot });

  return { ok: true, filename, post: result.data };
}
