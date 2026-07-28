import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

// ponytail: whole-file rewrite per mutation, single writer, no locking.
// Ceiling ~10k rows / one process. Upgrade path: swap this module for
// node:sqlite or a Supabase adapter — repositories are the only callers.

const MAX_BACKUPS = 5;

interface StoreOpts {
  baseDir?: string;
}

function resolveDir(opts?: StoreOpts): string {
  return opts?.baseDir ?? config.NUCLEUS_DATA_DIR;
}

function collectionFile(name: string, dir: string): string {
  return path.join(dir, `${name}.json`);
}

function backupsDir(dir: string): string {
  return path.join(dir, "backups");
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export async function readCollection<T>(name: string, opts?: StoreOpts): Promise<T[]> {
  const dir = resolveDir(opts);
  const file = collectionFile(name, dir);
  if (!fs.existsSync(file)) return [];

  const raw = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(raw) as T[];
  } catch {
    // Corrupt data must never crash the app or strand the user behind a
    // stack trace — back it up for forensics and reset to empty.
    ensureDir(backupsDir(dir));
    const backupName = `${name}.corrupt.${Date.now()}.json`;
    fs.writeFileSync(path.join(backupsDir(dir), backupName), raw);
    console.error(`[nucleus] corrupt collection "${name}" backed up as ${backupName}, resetting to empty`);
    return [];
  }
}

export async function writeCollection<T>(name: string, rows: T[], opts?: StoreOpts): Promise<void> {
  const dir = resolveDir(opts);
  ensureDir(dir);
  const file = collectionFile(name, dir);

  if (fs.existsSync(file)) {
    ensureDir(backupsDir(dir));
    const backupName = `${name}.${Date.now()}.json`;
    fs.copyFileSync(file, path.join(backupsDir(dir), backupName));
    pruneBackups(name, dir);
  }

  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, file);
}

function pruneBackups(name: string, dir: string): void {
  const dir_ = backupsDir(dir);
  const prefix = `${name}.`;
  const backups = fs
    .readdirSync(dir_)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json") && !f.includes(".corrupt."))
    .sort();

  const excess = backups.length - MAX_BACKUPS;
  if (excess <= 0) return;
  for (const file of backups.slice(0, excess)) {
    fs.unlinkSync(path.join(dir_, file));
  }
}
