import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let opts: { baseDir: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-observations-test-"));
  opts = { baseDir: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("observations repository", () => {
  it("creates an observation and lists it back newest-first", async () => {
    const observations = await import("@/server/db/repositories/observations");
    await observations.create(
      { ventureId: "v1", observedAt: "2026-08-01", metric: "Weekly signups", value: 10, note: null, source: "manual" },
      opts
    );
    await observations.create(
      { ventureId: "v1", observedAt: "2026-08-08", metric: "Weekly signups", value: 22, note: "picked up after launch", source: "manual" },
      opts
    );

    const list = await observations.listByVenture("v1", opts);
    expect(list).toHaveLength(2);
    expect(list[0].observedAt).toBe("2026-08-08"); // newest first
  });

  it("scopes observations by venture", async () => {
    const observations = await import("@/server/db/repositories/observations");
    await observations.create({ ventureId: "v1", observedAt: "2026-08-01", metric: "m", value: 1, note: null, source: "manual" }, opts);
    await observations.create({ ventureId: "v2", observedAt: "2026-08-01", metric: "m", value: 1, note: null, source: "manual" }, opts);

    const list = await observations.listByVenture("v1", opts);
    expect(list).toHaveLength(1);
  });

  it("get returns the observation by id, or null when missing", async () => {
    const observations = await import("@/server/db/repositories/observations");
    const created = await observations.create(
      { ventureId: "v1", observedAt: "2026-08-01", metric: "m", value: 1, note: null, source: "manual" },
      opts
    );

    expect((await observations.get(created.id, opts))?.id).toBe(created.id);
    expect(await observations.get("missing", opts)).toBeNull();
  });
});
