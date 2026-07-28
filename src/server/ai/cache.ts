import crypto from "node:crypto";
import { readCollection, writeCollection } from "../db/store";

const COLLECTION = "ai-cache";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  key: string;
  value: unknown;
  createdAt: string;
}

interface CacheOpts {
  baseDir?: string;
}

export function cacheKey(taskName: string, modelId: string, prompt: string): string {
  return crypto.createHash("sha256").update(`${taskName}:${modelId}:${prompt}`).digest("hex");
}

export async function getCached<T>(key: string, opts?: CacheOpts): Promise<T | null> {
  const rows = await readCollection<CacheEntry>(COLLECTION, opts);
  const entry = rows.find((r) => r.key === key);
  if (!entry) return null;
  if (Date.now() - new Date(entry.createdAt).getTime() > TTL_MS) return null;
  return entry.value as T;
}

export async function putCached(key: string, value: unknown, opts?: CacheOpts): Promise<void> {
  const rows = await readCollection<CacheEntry>(COLLECTION, opts);
  const filtered = rows.filter((r) => r.key !== key);
  filtered.unshift({ key, value, createdAt: new Date().toISOString() });
  await writeCollection(COLLECTION, filtered, opts);
}

export async function clearCache(opts?: CacheOpts): Promise<void> {
  await writeCollection(COLLECTION, [], opts);
}
