import { readCollection, writeCollection } from "../store";
import { BuildTaskSchema, type BuildTask } from "@/lib/domain";

const COLLECTION = "buildTasks";

interface RepoOpts {
  baseDir?: string;
}

export async function listByVenture(ventureId: string, opts?: RepoOpts): Promise<BuildTask[]> {
  const rows = await readCollection<BuildTask>(COLLECTION, opts);
  return rows.filter((t) => t.ventureId === ventureId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// One task per milestone, created wholesale when a venture starts building.
// Never called again for the same venture -- there is no re-scoping step.
export async function createMany(
  ventureId: string,
  inputs: Array<{ milestone: string; title: string }>,
  opts?: RepoOpts
): Promise<BuildTask[]> {
  const now = new Date().toISOString();
  const created: BuildTask[] = inputs.map((input) => ({
    id: crypto.randomUUID(),
    ventureId,
    milestone: input.milestone,
    title: input.title,
    done: false,
    createdAt: now,
    doneAt: null,
  }));
  created.forEach((t) => BuildTaskSchema.parse(t));

  const rows = await readCollection<BuildTask>(COLLECTION, opts);
  await writeCollection(COLLECTION, [...created, ...rows], opts);
  return created;
}

export async function setDone(id: string, done: boolean, opts?: RepoOpts): Promise<BuildTask> {
  const rows = await readCollection<BuildTask>(COLLECTION, opts);
  const idx = rows.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Build task not found: ${id}`);

  const updated: BuildTask = { ...rows[idx], done, doneAt: done ? new Date().toISOString() : null };
  rows[idx] = updated;
  await writeCollection(COLLECTION, rows, opts);
  return updated;
}
