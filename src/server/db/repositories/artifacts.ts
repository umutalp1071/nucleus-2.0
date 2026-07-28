import { readCollection, writeCollection } from "../store";
import { ArtifactSchema, type Artifact } from "@/lib/domain";

const COLLECTION = "artifacts";

interface RepoOpts {
  baseDir?: string;
}

export async function listByVenture(ventureId: string, opts?: RepoOpts): Promise<Artifact[]> {
  const rows = await readCollection<Artifact>(COLLECTION, opts);
  return rows
    .filter((a) => a.ventureId === ventureId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function create(
  input: Omit<Artifact, "id" | "createdAt">,
  opts?: RepoOpts
): Promise<Artifact> {
  const artifact: Artifact = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  ArtifactSchema.parse(artifact);
  const rows = await readCollection<Artifact>(COLLECTION, opts);
  await writeCollection(COLLECTION, [artifact, ...rows], opts);
  return artifact;
}

export async function latestOfKind(
  ventureId: string,
  kind: Artifact["kind"],
  opts?: RepoOpts
): Promise<Artifact | null> {
  const rows = await listByVenture(ventureId, opts); // already sorted newest-first
  return rows.find((a) => a.kind === kind) ?? null;
}
