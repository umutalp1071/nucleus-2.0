import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { writeCollection } from "@/server/db/store";
import type { AiCall } from "@/lib/domain";

let tmpDir: string;
let opts: { baseDir: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-budget-test-"));
  opts = { baseDir: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function call(costUsd: number, createdAt: string): AiCall {
  return {
    id: crypto.randomUUID(),
    task: "test",
    model: "mock",
    promptTokens: 10,
    completionTokens: 10,
    costUsd,
    cached: false,
    ventureId: null,
    reserved: false,
    createdAt,
  };
}

async function seed(calls: AiCall[]) {
  await writeCollection("ai-calls", calls, opts);
}

describe("budget: getSpend", () => {
  it("returns zero for an empty ledger", async () => {
    const { getSpend } = await import("@/server/ai/budget");
    const spend = await getSpend(opts);
    expect(spend).toEqual({ daily: 0, weekly: 0, monthly: 0 });
  });

  it("a call at 23:59 today does not count toward tomorrow's window", async () => {
    const { getSpend } = await import("@/server/ai/budget");
    // "now" is 00:30 on 2026-07-29; the call happened at 23:59 on 2026-07-28.
    const now = new Date("2026-07-29T00:30:00");
    await seed([call(5, "2026-07-28T23:59:00")]);
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBe(0);
    expect(spend.weekly).toBeCloseTo(5, 6); // still within the same week
  });

  it("handles the Sunday -> Monday week rollover", async () => {
    const { getSpend } = await import("@/server/ai/budget");
    // 2026-07-26 is a Sunday. 2026-07-27 is the following Monday.
    await seed([call(3, "2026-07-26T12:00:00")]);
    const mondayMorning = new Date("2026-07-27T09:00:00");
    const spend = await getSpend({ ...opts, now: mondayMorning });
    // Sunday's spend belongs to the PREVIOUS week and must not count toward
    // the new week that started Monday 00:00.
    expect(spend.weekly).toBe(0);
    expect(spend.monthly).toBeCloseTo(3, 6); // same month, still counts
  });

  it("sums multiple calls within the same day", async () => {
    const { getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await seed([
      call(1, "2026-07-28T09:00:00"),
      call(2, "2026-07-28T14:00:00"),
      call(0.5, "2026-07-27T23:00:00"), // yesterday, excluded from daily
    ]);
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeCloseTo(3, 6);
  });
});

describe("budget: preflight", () => {
  const caps = { daily: 10, weekly: 30, monthly: 50 };

  it("returns ok when well within every cap", async () => {
    const { preflight } = await import("@/server/ai/budget");
    const decision = await preflight(1, { ...opts, caps });
    expect(decision.decision).toBe("ok");
  });

  it("blocks exactly at the cap (zero headroom)", async () => {
    const { preflight } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await seed([call(10, "2026-07-28T09:00:00")]); // daily spend == daily cap
    const decision = await preflight(0.01, { ...opts, caps, now });
    expect(decision.decision).toBe("block");
    if (decision.decision === "block") {
      expect(decision.window).toBe("daily");
      expect(decision.capUsd).toBe(10);
      expect(decision.spentUsd).toBe(10);
    }
  });

  it("blocks when spend is one cent over the cap", async () => {
    const { preflight } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await seed([call(10.01, "2026-07-28T09:00:00")]);
    const decision = await preflight(0.001, { ...opts, caps, now });
    expect(decision.decision).toBe("block");
  });

  it("downgrades when the estimate exceeds headroom but headroom remains", async () => {
    const { preflight } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await seed([call(9.5, "2026-07-28T09:00:00")]); // $0.50 headroom left today
    const decision = await preflight(1, { ...opts, caps, now }); // estimate exceeds headroom
    expect(decision.decision).toBe("downgrade");
    if (decision.decision === "downgrade") {
      expect(decision.headroomUsd).toBeCloseTo(0.5, 6);
    }
  });

  it("the provider is never reached on a blocked call (asserted at the gateway level, not here)", () => {
    // Placeholder documenting intent — the real assertion lives in
    // tests/gateway.test.ts, since preflight() alone has no provider to call.
    expect(true).toBe(true);
  });
});

describe("budget: record", () => {
  it("writes a call to the ledger, which getSpend then reflects", async () => {
    const { record, getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await record(
      { task: "validate-idea", model: "mock", promptTokens: 100, completionTokens: 50, costUsd: 0.02, cached: false, ventureId: null, reserved: false },
      opts
    );
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeCloseTo(0.02, 6);
  });

  it("records a call even when it represents a failed/invalid response", async () => {
    // Tokens spent on a bad response are still tokens spent — record() has
    // no "success" concept, it just appends. The gateway is responsible for
    // calling it on both paths.
    const { record, getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await record(
      { task: "validate-idea", model: "mock", promptTokens: 200, completionTokens: 5, costUsd: 0.01, cached: false, ventureId: null, reserved: false },
      opts
    );
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeGreaterThan(0);
  });
});

describe("budget: reserve/reconcile", () => {
  it("a reservation counts toward spend immediately, before reconcile ever runs", async () => {
    // This is the fix for the hole where spend was only recorded after the
    // provider call returned -- a crash in between silently lost the ledger
    // row. See docs/reviews/2026-07-30-stack-position.md §6.2.
    const { reserve, getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await reserve(0.05, { task: "validate-idea", model: "mock", ventureId: null }, opts);
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeCloseTo(0.05, 6);
  });

  it("reconcile updates the same row to the actual cost, not a second row", async () => {
    const { reserve, reconcile, getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    const id = await reserve(0.05, { task: "validate-idea", model: "mock", ventureId: null }, opts);
    await reconcile(id, { costUsd: 0.02, promptTokens: 100, completionTokens: 20 }, opts);

    const { readCollection } = await import("@/server/db/store");
    const rows = await readCollection("ai-calls", opts);
    expect(rows.length).toBe(1);

    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeCloseTo(0.02, 6);
  });

  it("an un-reconciled reservation still counts at the estimate -- simulating a crash", async () => {
    const { reserve, getSpend } = await import("@/server/ai/budget");
    const now = new Date("2026-07-28T18:00:00");
    await reserve(0.05, { task: "validate-idea", model: "mock", ventureId: null }, opts);
    // No reconcile() call -- as if the process died right here.
    const spend = await getSpend({ ...opts, now });
    expect(spend.daily).toBeCloseTo(0.05, 6);
  });
});
