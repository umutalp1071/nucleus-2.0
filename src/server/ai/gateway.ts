import crypto from "node:crypto";
import type { z } from "zod";
import { TASKS, type TaskName } from "./tasks";
import { MODELS, TIER_ORDER, estimateCost, actualCost, type Tier } from "./models";
import * as budget from "./budget";
import type { Caps } from "./budget";
import { cacheKey, getCached, putCached } from "./cache";
import { resolveProvider, type Provider } from "./provider";
import { recordEvent } from "../events";

export type GatewayResult<T> =
  | {
      ok: true;
      data: T;
      costUsd: number;
      cached: boolean;
      demo: boolean;
      downgraded: boolean;
      // Provenance -- who actually produced this, so an outcome can later be
      // attributed to a decision. See
      // docs/reviews/2026-07-30-stack-position.md §5.1.
      modelId: string;
      tierRequested: Tier;
      tierUsed: Tier;
      promptVersion: string;
    }
  | {
      ok: false;
      reason: "budget_exceeded" | "invalid_output" | "provider_error";
      message: string;
    };

interface RunTaskOpts {
  ventureId?: string;
  baseDir?: string;
  provider?: Provider;
  caps?: Caps;
}

// User-facing messages never contain a model name, token count, or provider
// error string — the "freedom from needing to know" principle enforced at
// the message layer. See docs/plan/CONVENTIONS.md.
const MESSAGES = {
  budget_exceeded: (resetHint: string) => `Nucleus has reached today's spending limit. It resets ${resetHint}.`,
  invalid_output: () => "Nucleus couldn't make sense of that result. Try again.",
  provider_error: () => "The AI service isn't responding right now.",
};

function resetHintFor(window: "daily" | "weekly" | "monthly"): string {
  if (window === "daily") return "at midnight";
  if (window === "weekly") return "next Monday";
  return "next month";
}

function nextTierDown(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : null;
}

// A short, stable id for "which version of this prompt produced this
// output" -- hashes the task's prompt-generating function itself, not its
// per-call rendered output, so it only changes when the prompt is actually
// edited. See docs/reviews/2026-07-30-stack-position.md §5.1.
function promptVersionOf(taskName: TaskName): string {
  const source = TASKS[taskName].prompt.toString();
  return crypto.createHash("sha256").update(source).digest("hex").slice(0, 12);
}

function safeParseJson<T>(
  schema: z.ZodType<T>,
  text: string
): { success: true; data: T } | { success: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, error: "response was not valid JSON" };
  }
  const result = schema.safeParse(json);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}

// The chokepoint. Every AI call in Nucleus goes through this function —
// enforced by tests/boundaries.test.ts, which fails the build if anything
// outside server/ai/provider.ts references the model host directly.
export async function runTask<T>(
  taskName: TaskName,
  input: Record<string, unknown>,
  opts?: RunTaskOpts
): Promise<GatewayResult<T>> {
  const task = TASKS[taskName];
  const budgetOpts = { baseDir: opts?.baseDir, caps: opts?.caps };
  const eventOpts = { ventureId: opts?.ventureId, baseDir: opts?.baseDir };

  // A caller-supplied provider (tests) is never treated as demo mode --
  // "demo" specifically means "no real key configured, using Nucleus's own
  // mock fixtures," resolved fresh so a key added in Settings takes effect
  // on the very next call with no restart.
  const { provider: activeProvider, isMock: isDemo } = opts?.provider
    ? { provider: opts.provider, isMock: false }
    : await resolveProvider({ baseDir: opts?.baseDir });

  const prompt = task.prompt(input as never);

  // Resolve tier via the budget guard BEFORE touching the provider or the
  // cache — a blocked call must never reach either. Preflight checks 2x the
  // estimate, not 1x: the repair-retry path below makes a second, unguarded
  // completion call on schema failure, and reserving double headroom up
  // front is what keeps that retry inside the cap instead of silently
  // doubling an already-approved spend. See
  // docs/reviews/2026-07-30-stack-position.md §6.1.
  let tier: Tier = task.tier;
  for (;;) {
    const estimated = estimateCost(tier, prompt.length, task.expectedOutTokens);
    const decision = await budget.preflight(estimated * 2, budgetOpts);

    if (decision.decision === "ok") break;

    if (decision.decision === "downgrade") {
      const lower = nextTierDown(tier);
      if (lower && TIER_ORDER.indexOf(lower) >= TIER_ORDER.indexOf(task.minTier)) {
        tier = lower;
        continue;
      }
      await recordEvent("budget.blocked", `Blocked "${taskName}": no tier fits within budget.`, eventOpts);
      return {
        ok: false,
        reason: "budget_exceeded",
        message: MESSAGES.budget_exceeded("at the next reset"),
      };
    }

    // decision.decision === "block"
    await recordEvent(
      "budget.blocked",
      `Blocked "${taskName}": ${decision.window} limit reached.`,
      eventOpts
    );
    return {
      ok: false,
      reason: "budget_exceeded",
      message: MESSAGES.budget_exceeded(resetHintFor(decision.window)),
    };
  }

  const downgraded = tier !== task.tier;
  const modelId = MODELS[tier].id;
  const tierRequested = task.tier;
  const promptVersion = promptVersionOf(taskName);
  const estimated = estimateCost(tier, prompt.length, task.expectedOutTokens);

  // Cache is keyed on the RESOLVED tier's model, not the task's preferred
  // tier — a downgraded (cheaper, lower-quality) answer must never be
  // returned later under a preferred-tier lookup once budget recovers.
  const key = cacheKey(taskName, modelId, prompt);
  const hit = await getCached<T>(key, { baseDir: opts?.baseDir });
  if (hit !== null) {
    return { ok: true, data: hit, costUsd: 0, cached: true, demo: isDemo, downgraded, modelId, tierRequested, tierUsed: tier, promptVersion };
  }

  // Reserve BEFORE the provider call, at the estimate — see reconcile()'s
  // doc comment and docs/reviews/2026-07-30-stack-position.md §6.2. If the
  // process dies before reconcile runs, the reservation is what's left in
  // the ledger, not nothing.
  const reservationId = await budget.reserve(
    estimated,
    { task: taskName, model: modelId, ventureId: opts?.ventureId ?? null },
    { baseDir: opts?.baseDir }
  );

  let completion;
  try {
    completion = await activeProvider.complete(prompt, modelId, taskName);
  } catch {
    return { ok: false, reason: "provider_error", message: MESSAGES.provider_error() };
  }
  const primaryCost = actualCost(tier, completion.promptTokens, completion.completionTokens);
  await budget.reconcile(
    reservationId,
    { costUsd: primaryCost, promptTokens: completion.promptTokens, completionTokens: completion.completionTokens },
    { baseDir: opts?.baseDir }
  );

  let parsed = safeParseJson<T>(task.schema as z.ZodType<T>, completion.text);

  if (!parsed.success) {
    const repairPrompt = `${prompt}\n\nYour previous response was invalid: ${parsed.error}. Respond again with ONLY valid JSON matching the schema.`;

    const repairReservationId = await budget.reserve(
      estimated,
      { task: taskName, model: modelId, ventureId: opts?.ventureId ?? null },
      { baseDir: opts?.baseDir }
    );

    let repair;
    try {
      repair = await activeProvider.complete(repairPrompt, modelId, taskName);
    } catch {
      return { ok: false, reason: "provider_error", message: MESSAGES.provider_error() };
    }
    const repairCost = actualCost(tier, repair.promptTokens, repair.completionTokens);
    await budget.reconcile(
      repairReservationId,
      { costUsd: repairCost, promptTokens: repair.promptTokens, completionTokens: repair.completionTokens },
      { baseDir: opts?.baseDir }
    );

    parsed = safeParseJson<T>(task.schema as z.ZodType<T>, repair.text);
    if (!parsed.success) {
      return { ok: false, reason: "invalid_output", message: MESSAGES.invalid_output() };
    }

    await putCached(key, parsed.data, { baseDir: opts?.baseDir });
    return {
      ok: true,
      data: parsed.data,
      costUsd: primaryCost + repairCost,
      cached: false,
      demo: isDemo,
      downgraded,
      modelId,
      tierRequested,
      tierUsed: tier,
      promptVersion,
    };
  }

  await putCached(key, parsed.data, { baseDir: opts?.baseDir });
  return {
    ok: true,
    data: parsed.data,
    costUsd: primaryCost,
    cached: false,
    demo: isDemo,
    downgraded,
    modelId,
    tierRequested,
    tierUsed: tier,
    promptVersion,
  };
}
