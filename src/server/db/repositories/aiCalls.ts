import { readCollection, writeCollection } from "../store";
import { AiCallSchema, type AiCall } from "@/lib/domain";

const COLLECTION = "ai-calls";

interface RepoOpts {
  baseDir?: string;
}

export async function create(
  input: Omit<AiCall, "id" | "createdAt">,
  opts?: RepoOpts
): Promise<AiCall> {
  const call: AiCall = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  AiCallSchema.parse(call);
  const rows = await readCollection<AiCall>(COLLECTION, opts);
  await writeCollection(COLLECTION, [call, ...rows], opts);
  return call;
}

// Spend is always derived by summing the ledger over a window, never a
// stored counter — counters drift, and a drifted counter is a breached
// budget cap. See docs/plan/00-ANSWER.md §3.2.
export async function sumSince(date: Date, opts?: RepoOpts): Promise<number> {
  const rows = await readCollection<AiCall>(COLLECTION, opts);
  return rows
    .filter((c) => new Date(c.createdAt).getTime() >= date.getTime())
    .reduce((sum, c) => sum + c.costUsd, 0);
}

// The first place a user sees the cost of a decision, attached to the
// decision -- the venture workspace's "spend on this venture" line.
export async function sumByVenture(ventureId: string, opts?: RepoOpts): Promise<number> {
  const rows = await readCollection<AiCall>(COLLECTION, opts);
  return rows.filter((c) => c.ventureId === ventureId).reduce((sum, c) => sum + c.costUsd, 0);
}
