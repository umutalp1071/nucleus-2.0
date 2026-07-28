import { readCollection, writeCollection } from "../store";

const COLLECTION = "settings";

interface RepoOpts {
  baseDir?: string;
}

interface SettingRow {
  key: string;
  value: unknown;
}

export async function get<T>(key: string, defaultValue: T, opts?: RepoOpts): Promise<T> {
  const rows = await readCollection<SettingRow>(COLLECTION, opts);
  const row = rows.find((r) => r.key === key);
  return row ? (row.value as T) : defaultValue;
}

export async function set(key: string, value: unknown, opts?: RepoOpts): Promise<void> {
  const rows = await readCollection<SettingRow>(COLLECTION, opts);
  const idx = rows.findIndex((r) => r.key === key);
  if (idx === -1) rows.push({ key, value });
  else rows[idx] = { key, value };
  await writeCollection(COLLECTION, rows, opts);
}
