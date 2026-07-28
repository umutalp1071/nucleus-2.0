import { readCollection, writeCollection } from "../store";
import { NucleusEventSchema, type NucleusEvent } from "@/lib/domain";

const COLLECTION = "events";

interface RepoOpts {
  baseDir?: string;
}

export async function list(limit = 50, opts?: RepoOpts): Promise<NucleusEvent[]> {
  const rows = await readCollection<NucleusEvent>(COLLECTION, opts);
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function create(event: NucleusEvent, opts?: RepoOpts): Promise<NucleusEvent> {
  NucleusEventSchema.parse(event);
  const rows = await readCollection<NucleusEvent>(COLLECTION, opts);
  await writeCollection(COLLECTION, [event, ...rows], opts);
  return event;
}
