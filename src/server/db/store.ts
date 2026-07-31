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

// The only sanctioned way to write a non-JSON file under the data dir (e.g.
// the mock deploy target's generated HTML) -- store.ts stays the sole
// importer of node:fs, enforced by tests/boundaries.test.ts.
export async function writeRawFile(relPath: string, content: string, opts?: StoreOpts): Promise<string> {
  const dir = resolveDir(opts);
  // Absolute even when NUCLEUS_DATA_DIR is the default relative ".nucleus" --
  // callers turn this into a file:// URL, which is meaningless as a relative
  // path.
  const file = path.resolve(dir, relPath);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
  return file;
}

// For the Settings "Your data" panel -- printing the on-disk path and backup
// count is the most concrete possible expression of "under your own control."
export async function dataDirInfo(opts?: StoreOpts): Promise<{ dir: string; backupCount: number }> {
  const dir = resolveDir(opts);
  const dir_ = backupsDir(dir);
  if (!fs.existsSync(dir_)) return { dir, backupCount: 0 };
  const backupCount = fs.readdirSync(dir_).filter((f) => f.endsWith(".json")).length;
  return { dir, backupCount };
}

interface RepoFileOpts {
  // Root of the git repo -- distinct from `baseDir` above, which scopes the
  // user's `.nucleus/` data dir. Content drafts live in the tracked repo
  // tree (docs/content/), not the user's private data dir, so they need
  // their own root, injectable for tests. See docs/plan/PHASE-10-buildinpublic-engine.md.
  repoRoot?: string;
}

function resolveRepoRoot(opts?: RepoFileOpts): string {
  return opts?.repoRoot ?? process.cwd();
}

export async function readRepoFile(relPath: string, opts?: RepoFileOpts): Promise<string | null> {
  const file = path.join(resolveRepoRoot(opts), relPath);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

export async function writeRepoFile(relPath: string, content: string, opts?: RepoFileOpts): Promise<void> {
  const file = path.join(resolveRepoRoot(opts), relPath);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

export async function listRepoDir(relPath: string, opts?: RepoFileOpts): Promise<string[]> {
  const dir = path.join(resolveRepoRoot(opts), relPath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
}

export async function moveRepoFile(fromRelPath: string, toRelPath: string, opts?: RepoFileOpts): Promise<void> {
  const root = resolveRepoRoot(opts);
  const from = path.join(root, fromRelPath);
  const to = path.join(root, toRelPath);
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
}

export async function deleteRepoFile(relPath: string, opts?: RepoFileOpts): Promise<void> {
  const file = path.join(resolveRepoRoot(opts), relPath);
  if (fs.existsSync(file)) fs.unlinkSync(file);
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
