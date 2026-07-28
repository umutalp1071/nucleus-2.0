import * as eventsRepo from "./db/repositories/events";
import type { NucleusEvent } from "@/lib/domain";

export async function recordEvent(
  type: string,
  summary: string,
  opts?: { ventureId?: string; payload?: unknown; baseDir?: string }
): Promise<void> {
  const event: NucleusEvent = {
    id: crypto.randomUUID(),
    ventureId: opts?.ventureId ?? null,
    type,
    summary,
    payload: opts?.payload,
    createdAt: new Date().toISOString(),
  };
  await eventsRepo.create(event, { baseDir: opts?.baseDir });
}
