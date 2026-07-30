import { readCollection, writeCollection } from "../store";
import { PredictionSchema, type Prediction } from "@/lib/domain";

const COLLECTION = "predictions";

interface RepoOpts {
  baseDir?: string;
}

export async function create(input: Omit<Prediction, "id" | "createdAt">, opts?: RepoOpts): Promise<Prediction> {
  const prediction: Prediction = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  PredictionSchema.parse(prediction);
  const rows = await readCollection<Prediction>(COLLECTION, opts);
  await writeCollection(COLLECTION, [prediction, ...rows], opts);
  return prediction;
}

export async function listByVenture(ventureId: string, opts?: RepoOpts): Promise<Prediction[]> {
  const rows = await readCollection<Prediction>(COLLECTION, opts);
  return rows
    .filter((p) => p.ventureId === ventureId)
    .sort((a, b) => a.resolveBy.localeCompare(b.resolveBy));
}

export async function listOpen(ventureId: string, opts?: RepoOpts): Promise<Prediction[]> {
  const rows = await listByVenture(ventureId, opts);
  return rows.filter((p) => p.status === "open");
}

export async function resolve(
  id: string,
  status: Exclude<Prediction["status"], "open">,
  observationId: string | null,
  opts?: RepoOpts
): Promise<Prediction> {
  const rows = await readCollection<Prediction>(COLLECTION, opts);
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Prediction not found: ${id}`);
  const updated: Prediction = {
    ...rows[idx],
    status,
    resolvedAt: new Date().toISOString(),
    resolvedBy: observationId,
  };
  rows[idx] = updated;
  await writeCollection(COLLECTION, rows, opts);
  return updated;
}
