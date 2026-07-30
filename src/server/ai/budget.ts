import * as aiCallsRepo from "../db/repositories/aiCalls";
import * as settingsRepo from "../db/repositories/settings";
import type { AiCall } from "@/lib/domain";

export interface Caps {
  daily: number;
  weekly: number;
  monthly: number;
}

export const DEFAULT_CAPS: Caps = { daily: 10, weekly: 30, monthly: 50 };

type Window = "daily" | "weekly" | "monthly";

export type PreflightDecision =
  | { decision: "ok" }
  | { decision: "downgrade"; headroomUsd: number }
  | { decision: "block"; window: Window; capUsd: number; spentUsd: number };

interface BudgetOpts {
  baseDir?: string;
  caps?: Caps;
  now?: Date;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay(); // 0 = Sunday
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  r.setDate(r.getDate() - daysSinceMonday);
  return r;
}

function startOfMonth(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(1);
  return r;
}

// Spend is always derived by summing the ledger over a window, never a
// stored counter — counters drift, and a drifted counter is a breached
// budget cap. See docs/plan/00-ANSWER.md §3.2.
export async function getSpend(opts?: BudgetOpts): Promise<Record<Window, number>> {
  const now = opts?.now ?? new Date();
  const repoOpts = { baseDir: opts?.baseDir };
  const [daily, weekly, monthly] = await Promise.all([
    aiCallsRepo.sumSince(startOfDay(now), repoOpts),
    aiCallsRepo.sumSince(startOfWeek(now), repoOpts),
    aiCallsRepo.sumSince(startOfMonth(now), repoOpts),
  ]);
  return { daily, weekly, monthly };
}

export async function preflight(estimatedUsd: number, opts?: BudgetOpts): Promise<PreflightDecision> {
  const caps = opts?.caps ?? (await settingsRepo.get("budgetCaps", DEFAULT_CAPS, { baseDir: opts?.baseDir }));
  const spend = await getSpend(opts);

  const windows: Array<{ name: Window; cap: number; spent: number }> = [
    { name: "daily", cap: caps.daily, spent: spend.daily },
    { name: "weekly", cap: caps.weekly, spent: spend.weekly },
    { name: "monthly", cap: caps.monthly, spent: spend.monthly },
  ];

  let tightestHeadroom: number | null = null;
  for (const w of windows) {
    const headroom = w.cap - w.spent;
    if (headroom <= 0) {
      return { decision: "block", window: w.name, capUsd: w.cap, spentUsd: w.spent };
    }
    if (tightestHeadroom === null || headroom < tightestHeadroom) {
      tightestHeadroom = headroom;
    }
  }

  if (tightestHeadroom !== null && estimatedUsd > tightestHeadroom) {
    return { decision: "downgrade", headroomUsd: tightestHeadroom };
  }
  return { decision: "ok" };
}

export async function record(
  call: Omit<AiCall, "id" | "createdAt">,
  opts?: { baseDir?: string }
): Promise<void> {
  await aiCallsRepo.create(call, opts);
}

// Writes the ledger row BEFORE the provider is called, at the estimated
// cost -- so spend is never lost between "the call happened" and "the
// response finished," which is the hole in the $50 invariant described in
// docs/reviews/2026-07-30-stack-position.md §6.2. Call reconcile() after the
// response returns; if the process dies first, the estimate stands.
export async function reserve(
  estimatedUsd: number,
  call: { task: string; model: string; ventureId: string | null },
  opts?: { baseDir?: string }
): Promise<string> {
  const row = await aiCallsRepo.create(
    {
      task: call.task,
      model: call.model,
      ventureId: call.ventureId,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: estimatedUsd,
      cached: false,
      reserved: true,
    },
    opts
  );
  return row.id;
}

export async function reconcile(
  id: string,
  actual: { costUsd: number; promptTokens: number; completionTokens: number },
  opts?: { baseDir?: string }
): Promise<void> {
  await aiCallsRepo.update(
    id,
    { costUsd: actual.costUsd, promptTokens: actual.promptTokens, completionTokens: actual.completionTokens, reserved: false },
    opts
  );
}
