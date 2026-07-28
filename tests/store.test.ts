import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-store-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("store", () => {
  it("returns an empty array for a collection that doesn't exist yet", async () => {
    const { readCollection } = await import("@/server/db/store");
    const rows = await readCollection<{ id: string }>("ventures", { baseDir: tmpDir });
    expect(rows).toEqual([]);
  });

  it("round-trips data through write then read", async () => {
    const { readCollection, writeCollection } = await import("@/server/db/store");
    const rows = [{ id: "1", title: "Test" }];
    await writeCollection("ventures", rows, { baseDir: tmpDir });
    const readBack = await readCollection<{ id: string; title: string }>("ventures", { baseDir: tmpDir });
    expect(readBack).toEqual(rows);
  });

  it("writes atomically: no .tmp file remains after a successful write", async () => {
    const { writeCollection } = await import("@/server/db/store");
    await writeCollection("ventures", [{ id: "1" }], { baseDir: tmpDir });
    expect(fs.existsSync(path.join(tmpDir, "ventures.json.tmp"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, "ventures.json"))).toBe(true);
  });

  it("recovers from a corrupt collection file instead of throwing", async () => {
    const { readCollection } = await import("@/server/db/store");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "ventures.json"), "{ not valid json ][");

    const rows = await readCollection("ventures", { baseDir: tmpDir });
    expect(rows).toEqual([]);

    const backups = fs.readdirSync(path.join(tmpDir, "backups"));
    expect(backups.some((f) => f.includes("corrupt"))).toBe(true);
  });

  it("keeps at most 5 backups, pruning the oldest", async () => {
    const { writeCollection } = await import("@/server/db/store");
    for (let i = 0; i < 7; i++) {
      await writeCollection("ventures", [{ id: String(i) }], { baseDir: tmpDir });
      // ensure distinct backup timestamps across rapid writes
      await new Promise((r) => setTimeout(r, 2));
    }
    const backupDir = path.join(tmpDir, "backups");
    const backups = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("ventures.") && !f.includes("corrupt"));
    expect(backups.length).toBe(5);
  });

  it("creates the data directory on demand", async () => {
    const { writeCollection } = await import("@/server/db/store");
    const nested = path.join(tmpDir, "nested", "deeper");
    await writeCollection("ventures", [{ id: "1" }], { baseDir: nested });
    expect(fs.existsSync(path.join(nested, "ventures.json"))).toBe(true);
  });
});
