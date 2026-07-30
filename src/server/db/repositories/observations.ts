import { readCollection, writeCollection } from "../store";
import { ObservationSchema, type Observation } from "@/lib/domain";

const COLLECTION = "observations";

interface RepoOpts {
  baseDir?: string;
}

export async function create(input: Omit<Observation, "id" | "createdAt">, opts?: RepoOpts): Promise<Observation> {
  const observation: Observation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  ObservationSchema.parse(observation);
  const rows = await readCollection<Observation>(COLLECTION, opts);
  await writeCollection(COLLECTION, [observation, ...rows], opts);
  return observation;
}

export async function listByVenture(ventureId: string, opts?: RepoOpts): Promise<Observation[]> {
  const rows = await readCollection<Observation>(COLLECTION, opts);
  return rows
    .filter((o) => o.ventureId === ventureId)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}
