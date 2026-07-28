import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Walks src/ once and asserts the architecture rules in docs/plan/ARCHITECTURE.md.
// These rules exist so the AI chokepoint, the fs boundary, and the
// client/server split can never be silently violated by a later edit.

const SRC_DIR = path.resolve(__dirname, "../src");

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (/\.(ts|tsx)$/.test(entry.name)) return [full];
    return [];
  });
}

function relative(file: string): string {
  return path.relative(SRC_DIR, file).replace(/\\/g, "/");
}

const files = walk(SRC_DIR);
const contents = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));

describe("architecture boundaries", () => {
  it("no client component imports from @/server (or a relative ../server path)", () => {
    const violations: string[] = [];
    for (const file of files) {
      const src = contents.get(file)!;
      const isClient = /^\s*["']use client["'];?/m.test(src);
      if (!isClient) continue;
      const importsServer = /from\s+["'](@\/server|(\.\.\/)+server)/.test(src);
      if (importsServer) violations.push(relative(file));
    }
    expect(violations).toEqual([]);
  });

  it("only src/server/ai/provider.ts references the OpenRouter host", () => {
    const violations: string[] = [];
    for (const file of files) {
      if (relative(file) === "server/ai/provider.ts") continue;
      const src = contents.get(file)!;
      if (src.includes("openrouter.ai")) violations.push(relative(file));
    }
    expect(violations).toEqual([]);
  });

  it("only src/server/db/store.ts imports node:fs", () => {
    const violations: string[] = [];
    for (const file of files) {
      if (relative(file) === "server/db/store.ts") continue;
      const src = contents.get(file)!;
      if (/from\s+["']node:fs/.test(src) || /require\(["']node:fs["']\)/.test(src)) {
        violations.push(relative(file));
      }
    }
    expect(violations).toEqual([]);
  });

  it("src/lib/** never imports a node: builtin", () => {
    const violations: string[] = [];
    for (const file of files) {
      if (!relative(file).startsWith("lib/")) continue;
      const src = contents.get(file)!;
      if (/from\s+["']node:/.test(src)) violations.push(relative(file));
    }
    expect(violations).toEqual([]);
  });
});
