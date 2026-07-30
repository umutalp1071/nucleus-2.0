import { readCollection, writeCollection } from "../store";
import * as artifactsRepo from "./artifacts";
import { DecisionSchema, type Decision } from "@/lib/domain";

const COLLECTION = "decisions";

interface RepoOpts {
  baseDir?: string;
}

export async function create(input: Omit<Decision, "id" | "createdAt">, opts?: RepoOpts): Promise<Decision> {
  const decision: Decision = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  DecisionSchema.parse(decision);
  const rows = await readCollection<Decision>(COLLECTION, opts);
  await writeCollection(COLLECTION, [decision, ...rows], opts);
  return decision;
}

// Artifacts created before this phase have no Decision -- honest backfill
// with modelId "unknown" rather than a gap in the graph. `task` is taken from
// the artifact's own (pre-fix) `model` field, which used to hold the task
// name -- see docs/reviews/2026-07-30-stack-position.md §6.3/§8.
async function backfill(artifact: { id: string; ventureId: string; model: string; costUsd: number; demo: boolean }, opts?: RepoOpts): Promise<Decision> {
  return create(
    {
      ventureId: artifact.ventureId,
      task: artifact.model,
      artifactId: artifact.id,
      promptVersion: "unknown",
      inputRefs: [],
      modelId: "unknown",
      tierRequested: "unknown",
      tierUsed: "unknown",
      downgraded: false,
      cached: false,
      demo: artifact.demo,
      costUsd: artifact.costUsd,
      humanVerdict: "pending",
      humanReason: null,
    },
    opts
  );
}

// Backfills on first read -- see docs/reviews/2026-07-30-stack-position.md §8.
export async function listByVenture(ventureId: string, opts?: RepoOpts): Promise<Decision[]> {
  const rows = await readCollection<Decision>(COLLECTION, opts);
  const existing = rows.filter((d) => d.ventureId === ventureId);
  const covered = new Set(existing.map((d) => d.artifactId));

  const artifacts = await artifactsRepo.listByVenture(ventureId, opts);
  const missing = artifacts.filter((a) => !covered.has(a.id));
  if (missing.length === 0) {
    return existing.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const backfilled: Decision[] = [];
  for (const artifact of missing) {
    backfilled.push(await backfill(artifact, opts));
  }
  return [...existing, ...backfilled].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findByArtifactId(artifactId: string, opts?: RepoOpts): Promise<Decision | null> {
  const rows = await readCollection<Decision>(COLLECTION, opts);
  return rows.find((d) => d.artifactId === artifactId) ?? null;
}

// The regenerate flow's "why?" becomes the cheapest evaluation corpus in the
// product -- see docs/reviews/2026-07-30-stack-position.md §5.4.
export async function markHumanFeedback(
  artifactId: string,
  humanVerdict: Decision["humanVerdict"],
  humanReason: string | null,
  opts?: RepoOpts
): Promise<void> {
  const rows = await readCollection<Decision>(COLLECTION, opts);
  const idx = rows.findIndex((d) => d.artifactId === artifactId);
  if (idx === -1) return; // no decision on file for this artifact -- nothing to annotate
  rows[idx] = { ...rows[idx], humanVerdict, humanReason };
  await writeCollection(COLLECTION, rows, opts);
}
