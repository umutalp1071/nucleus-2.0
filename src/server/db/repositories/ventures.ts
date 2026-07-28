import { readCollection, writeCollection } from "../store";
import { VentureSchema, type Venture, type Stage } from "@/lib/domain";
import { assertTransition } from "@/lib/stages";
import { recordEvent } from "../../events";

const COLLECTION = "ventures";

interface RepoOpts {
  baseDir?: string;
}

export async function list(opts?: RepoOpts): Promise<Venture[]> {
  const rows = await readCollection<Venture>(COLLECTION, opts);
  return [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function get(id: string, opts?: RepoOpts): Promise<Venture | null> {
  const rows = await readCollection<Venture>(COLLECTION, opts);
  return rows.find((v) => v.id === id) ?? null;
}

export async function create(
  input: { title: string; description: string },
  opts?: RepoOpts
): Promise<Venture> {
  const now = new Date().toISOString();
  const venture: Venture = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    stage: "captured",
    verdictScore: null,
    createdAt: now,
    updatedAt: now,
  };
  VentureSchema.parse(venture);

  const rows = await readCollection<Venture>(COLLECTION, opts);
  await writeCollection(COLLECTION, [venture, ...rows], opts);
  await recordEvent("venture.created", `Captured new idea: "${venture.title}"`, {
    ventureId: venture.id,
    baseDir: opts?.baseDir,
  });
  return venture;
}

export async function update(
  id: string,
  patch: { title?: string; description?: string },
  opts?: RepoOpts
): Promise<Venture> {
  const rows = await readCollection<Venture>(COLLECTION, opts);
  const idx = rows.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Venture not found: ${id}`);

  const updated: Venture = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
  VentureSchema.parse(updated);
  rows[idx] = updated;
  await writeCollection(COLLECTION, rows, opts);
  return updated;
}

// The only path that changes `stage` — the API never writes it directly, so
// the transition table in src/lib/stages.ts stays the sole authority.
export async function advance(id: string, toStage: Stage, opts?: RepoOpts): Promise<Venture> {
  const rows = await readCollection<Venture>(COLLECTION, opts);
  const idx = rows.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Venture not found: ${id}`);

  const venture = rows[idx];
  assertTransition(venture.stage, toStage);

  const updated: Venture = { ...venture, stage: toStage, updatedAt: new Date().toISOString() };
  rows[idx] = updated;
  await writeCollection(COLLECTION, rows, opts);
  await recordEvent("venture.advanced", `"${venture.title}" moved to ${toStage}`, {
    ventureId: id,
    payload: { from: venture.stage, to: toStage },
    baseDir: opts?.baseDir,
  });
  return updated;
}

// Soft delete: archive, never destroy a venture's history.
export async function remove(id: string, opts?: RepoOpts): Promise<Venture> {
  return advance(id, "archived", opts);
}
