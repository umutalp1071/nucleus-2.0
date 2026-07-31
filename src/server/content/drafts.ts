import * as settingsRepo from "../db/repositories/settings";
import { readRepoFile, writeRepoFile, listRepoDir, moveRepoFile, deleteRepoFile } from "../db/store";

export interface DraftFile {
  filename: string;
  content: string;
}

interface Opts {
  baseDir?: string;
  repoRoot?: string;
}

export const VOICE_SAMPLES_KEY = "buildInPublicVoiceSamples";
export const REJECTIONS_KEY = "buildInPublicRejections";
const MAX_REJECTIONS = 5;
const MAX_VOICE_SAMPLES = 3;

const DRAFTS_DIR = "docs/content/drafts";
const PUBLISHED_DIR = "docs/content/published";

export async function listDrafts(opts?: Opts): Promise<DraftFile[]> {
  const filenames = await listRepoDir(DRAFTS_DIR, { repoRoot: opts?.repoRoot });
  const files = await Promise.all(
    filenames.map(async (filename) => ({
      filename,
      content: (await readRepoFile(`${DRAFTS_DIR}/${filename}`, { repoRoot: opts?.repoRoot })) ?? "",
    }))
  );
  // newest-first, matching every other list in this app
  return files.sort((a, b) => b.filename.localeCompare(a.filename));
}

export async function editDraft(filename: string, content: string, opts?: Opts): Promise<void> {
  await writeRepoFile(`${DRAFTS_DIR}/${filename}`, content, { repoRoot: opts?.repoRoot });
}

// Approve: moves the file to docs/content/published/ verbatim -- the
// filename already carries the date it was written, which the playbook
// treats as the historical record. Never delete or renumber.
export async function approveDraft(filename: string, opts?: Opts): Promise<void> {
  await moveRepoFile(`${DRAFTS_DIR}/${filename}`, `${PUBLISHED_DIR}/${filename}`, { repoRoot: opts?.repoRoot });
}

// Reject: deletes the draft and remembers the reason as a negative example
// for the next generation -- the cheapest possible learning mechanism, no
// ML required. Capped so the prompt doesn't grow unbounded.
export async function rejectDraft(filename: string, reason: string, opts?: Opts): Promise<void> {
  await deleteRepoFile(`${DRAFTS_DIR}/${filename}`, { repoRoot: opts?.repoRoot });
  const rows = await settingsRepo.get<string[]>(REJECTIONS_KEY, [], { baseDir: opts?.baseDir });
  await settingsRepo.set(REJECTIONS_KEY, [reason, ...rows].slice(0, MAX_REJECTIONS), { baseDir: opts?.baseDir });
}

// Files a founder can pick as voice-calibration examples -- published posts
// first (already vetted by the founder's own approval), then remaining
// drafts.
export async function listVoiceSources(opts?: Opts): Promise<string[]> {
  const [published, drafts] = await Promise.all([
    listRepoDir(PUBLISHED_DIR, { repoRoot: opts?.repoRoot }),
    listRepoDir(DRAFTS_DIR, { repoRoot: opts?.repoRoot }),
  ]);
  return [...published.map((f) => `published/${f}`), ...drafts.map((f) => `drafts/${f}`)];
}

export async function getVoiceSamples(opts?: Opts): Promise<string[]> {
  return settingsRepo.get<string[]>(VOICE_SAMPLES_KEY, [], { baseDir: opts?.baseDir });
}

export async function setVoiceSamples(paths: string[], opts?: Opts): Promise<void> {
  await settingsRepo.set(VOICE_SAMPLES_KEY, paths.slice(0, MAX_VOICE_SAMPLES), { baseDir: opts?.baseDir });
}

export async function loadVoiceAndRejections(opts?: Opts): Promise<{ voiceSamples: string[]; rejectedReasons: string[] }> {
  const [paths, rejectedReasons] = await Promise.all([
    getVoiceSamples(opts),
    settingsRepo.get<string[]>(REJECTIONS_KEY, [], { baseDir: opts?.baseDir }),
  ]);
  const samples = await Promise.all(
    paths.map((p) => readRepoFile(`docs/content/${p}`, { repoRoot: opts?.repoRoot }))
  );
  return { voiceSamples: samples.filter((s): s is string => s !== null), rejectedReasons };
}
