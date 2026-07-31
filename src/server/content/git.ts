import { execFileSync } from "node:child_process";

// ponytail: reads git log via child_process, no git library. One command,
// parsed with split(). See docs/plan/PHASE-10-buildinpublic-engine.md.

export interface RecentCommitsOpts {
  cwd?: string;
  limit?: number;
  // Injectable for tests -- never shells out to a real repo in the suite.
  exec?: typeof execFileSync;
}

export function recentCommits(opts?: RecentCommitsOpts): string[] {
  const exec = opts?.exec ?? execFileSync;
  const limit = opts?.limit ?? 20;
  let out: string;
  try {
    out = exec("git", ["log", `-${limit}`, "--oneline"], {
      cwd: opts?.cwd ?? process.cwd(),
      encoding: "utf8",
    }) as unknown as string;
  } catch {
    return [];
  }
  return out.split("\n").map((l) => l.trim()).filter(Boolean);
}
