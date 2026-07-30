import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let opts: { baseDir: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-predictions-test-"));
  opts = { baseDir: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("predictions repository", () => {
  it("listOpen returns only open predictions, sorted by resolveBy", async () => {
    const predictions = await import("@/server/db/repositories/predictions");
    await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "c1", metric: "m1", target: 10, resolveBy: "2026-09-01", source: "plan.successMetric" as const, status: "open" as const, resolvedAt: null, resolvedBy: null },
      opts
    );
    const earlier = await predictions.create(
      { ventureId: "v1", decisionId: "d2", claim: "c2", metric: "m2", target: 5, resolveBy: "2026-08-01", source: "plan.successMetric" as const, status: "open" as const, resolvedAt: null, resolvedBy: null },
      opts
    );
    await predictions.resolve(earlier.id, "hit", null, opts);

    const open = await predictions.listOpen("v1", opts);
    expect(open).toHaveLength(1);
    expect(open[0].metric).toBe("m1");
  });

  it("resolve sets status, resolvedAt, and resolvedBy", async () => {
    const predictions = await import("@/server/db/repositories/predictions");
    const p = await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "c", metric: "m", target: 10, resolveBy: "2026-09-01", source: "plan.successMetric" as const, status: "open" as const, resolvedAt: null, resolvedBy: null },
      opts
    );

    const resolved = await predictions.resolve(p.id, "missed", "obs-1", opts);

    expect(resolved.status).toBe("missed");
    expect(resolved.resolvedBy).toBe("obs-1");
    expect(resolved.resolvedAt).not.toBeNull();
  });

  it("listByVenture only returns predictions for that venture", async () => {
    const predictions = await import("@/server/db/repositories/predictions");
    await predictions.create(
      { ventureId: "v1", decisionId: "d1", claim: "c", metric: "m", target: 1, resolveBy: "2026-09-01", source: "plan.successMetric" as const, status: "open" as const, resolvedAt: null, resolvedBy: null },
      opts
    );
    await predictions.create(
      { ventureId: "v2", decisionId: "d2", claim: "c", metric: "m", target: 1, resolveBy: "2026-09-01", source: "plan.successMetric" as const, status: "open" as const, resolvedAt: null, resolvedBy: null },
      opts
    );

    const list = await predictions.listByVenture("v1", opts);
    expect(list).toHaveLength(1);
  });
});
