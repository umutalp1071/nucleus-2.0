import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import * as events from "@/server/db/repositories/events";
import * as aiCalls from "@/server/db/repositories/aiCalls";
import * as settings from "@/server/db/repositories/settings";
import * as buildTasks from "@/server/db/repositories/buildTasks";

let tmpDir: string;
let opts: { baseDir: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-repo-test-"));
  opts = { baseDir: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("ventures repository", () => {
  it("creates a venture at the captured stage and records an event", async () => {
    const venture = await ventures.create({ title: "AI recipe planner", description: "..." }, opts);
    expect(venture.stage).toBe("captured");
    expect(venture.verdictScore).toBeNull();

    const found = await ventures.get(venture.id, opts);
    expect(found?.title).toBe("AI recipe planner");

    const recent = await events.list(10, opts);
    expect(recent.some((e) => e.type === "venture.created" && e.ventureId === venture.id)).toBe(true);
  });

  it("list returns newest-updated first", async () => {
    const a = await ventures.create({ title: "First", description: "" }, opts);
    await new Promise((r) => setTimeout(r, 2));
    const b = await ventures.create({ title: "Second", description: "" }, opts);
    const rows = await ventures.list(opts);
    expect(rows[0].id).toBe(b.id);
    expect(rows[1].id).toBe(a.id);
  });

  it("update patches fields without touching stage", async () => {
    const venture = await ventures.create({ title: "Old title", description: "" }, opts);
    const updated = await ventures.update(venture.id, { title: "New title" }, opts);
    expect(updated.title).toBe("New title");
    expect(updated.stage).toBe("captured");
  });

  it("advance follows the transition table and records an event", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    const advanced = await ventures.advance(venture.id, "validated", opts);
    expect(advanced.stage).toBe("validated");

    const recent = await events.list(10, opts);
    expect(recent.some((e) => e.type === "venture.advanced")).toBe(true);
  });

  it("advance rejects an illegal transition and leaves the venture unchanged", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    await expect(ventures.advance(venture.id, "launched", opts)).rejects.toThrow();
    const unchanged = await ventures.get(venture.id, opts);
    expect(unchanged?.stage).toBe("captured");
  });

  it("remove soft-deletes by archiving", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    const archived = await ventures.remove(venture.id, opts);
    expect(archived.stage).toBe("archived");
    // still readable — not hard-deleted
    const found = await ventures.get(venture.id, opts);
    expect(found).not.toBeNull();
  });
});

describe("artifacts repository", () => {
  it("creates and lists artifacts scoped to a venture, newest first", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    await artifacts.create(
      { ventureId: venture.id, kind: "validation", stage: "captured", content: { score: 34 }, model: "mock", costUsd: 0, demo: false },
      opts
    );
    await new Promise((r) => setTimeout(r, 2));
    await artifacts.create(
      { ventureId: venture.id, kind: "competitors", stage: "validated", content: {}, model: "mock", costUsd: 0, demo: false },
      opts
    );

    const rows = await artifacts.listByVenture(venture.id, opts);
    expect(rows).toHaveLength(2);
    expect(rows[0].kind).toBe("competitors"); // newest first
  });

  it("latestOfKind returns the most recent artifact of that kind only", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    await artifacts.create(
      { ventureId: venture.id, kind: "plan", stage: "validated", content: { v: 1 }, model: "mock", costUsd: 0, demo: false },
      opts
    );
    await new Promise((r) => setTimeout(r, 2));
    await artifacts.create(
      { ventureId: venture.id, kind: "plan", stage: "validated", content: { v: 2 }, model: "mock", costUsd: 0, demo: false },
      opts
    );

    const latest = await artifacts.latestOfKind(venture.id, "plan", opts);
    expect((latest?.content as { v: number }).v).toBe(2);

    const missing = await artifacts.latestOfKind(venture.id, "landing_page", opts);
    expect(missing).toBeNull();
  });
});

describe("aiCalls repository", () => {
  it("sumSince derives spend from the ledger, not a counter", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await aiCalls.create(
      { task: "validate-idea", model: "mock", promptTokens: 100, completionTokens: 50, costUsd: 0.01, cached: false, ventureId: null },
      opts
    );
    await aiCalls.create(
      { task: "validate-idea", model: "mock", promptTokens: 100, completionTokens: 50, costUsd: 0.02, cached: false, ventureId: null },
      opts
    );

    const total = await aiCalls.sumSince(yesterday, opts);
    expect(total).toBeCloseTo(0.03, 5);

    const future = new Date(now.getTime() + 60_000);
    const totalAfter = await aiCalls.sumSince(future, opts);
    expect(totalAfter).toBe(0);
  });

  it("sumByVenture sums only calls attributed to that venture", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    await aiCalls.create(
      { task: "validate-idea", model: "mock", promptTokens: 10, completionTokens: 10, costUsd: 0.05, cached: false, ventureId: venture.id },
      opts
    );
    await aiCalls.create(
      { task: "validate-idea", model: "mock", promptTokens: 10, completionTokens: 10, costUsd: 0.07, cached: false, ventureId: null },
      opts
    );
    const total = await aiCalls.sumByVenture(venture.id, opts);
    expect(total).toBeCloseTo(0.05, 5);
  });
});

describe("buildTasks repository", () => {
  it("createMany creates one task per input, in order, all undone", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    const created = await buildTasks.createMany(
      venture.id,
      [
        { milestone: "m1", title: "t1" },
        { milestone: "m2", title: "t2" },
      ],
      opts
    );
    expect(created).toHaveLength(2);
    expect(created.every((t) => t.done === false && t.doneAt === null)).toBe(true);

    const listed = await buildTasks.listByVenture(venture.id, opts);
    expect(listed.map((t) => t.title)).toEqual(["t1", "t2"]);
  });

  it("setDone toggles done and stamps/clears doneAt", async () => {
    const venture = await ventures.create({ title: "Idea", description: "" }, opts);
    const [task] = await buildTasks.createMany(venture.id, [{ milestone: "m1", title: "t1" }], opts);

    const done = await buildTasks.setDone(task.id, true, opts);
    expect(done.done).toBe(true);
    expect(done.doneAt).not.toBeNull();

    const undone = await buildTasks.setDone(task.id, false, opts);
    expect(undone.done).toBe(false);
    expect(undone.doneAt).toBeNull();
  });

  it("listByVenture only returns tasks for that venture", async () => {
    const a = await ventures.create({ title: "A", description: "" }, opts);
    const b = await ventures.create({ title: "B", description: "" }, opts);
    await buildTasks.createMany(a.id, [{ milestone: "m", title: "a-task" }], opts);
    await buildTasks.createMany(b.id, [{ milestone: "m", title: "b-task" }], opts);

    const listed = await buildTasks.listByVenture(a.id, opts);
    expect(listed.map((t) => t.title)).toEqual(["a-task"]);
  });
});

describe("settings repository", () => {
  it("returns the default when a key is unset, then persists a set value", async () => {
    const before = await settings.get("budgetCaps", { daily: 10 }, opts);
    expect(before).toEqual({ daily: 10 });

    await settings.set("budgetCaps", { daily: 5 }, opts);
    const after = await settings.get("budgetCaps", { daily: 10 }, opts);
    expect(after).toEqual({ daily: 5 });
  });
});
