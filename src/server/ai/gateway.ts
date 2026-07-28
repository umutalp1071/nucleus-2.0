import type { z } from "zod";
import { TASKS, type TaskName } from "./tasks";
import { MODELS, TIER_ORDER, estimateCost, actualCost, type Tier } from "./models";
import * as budget from "./budget";
import type { Caps } from "./budget";
import { cacheKey, getCached, putCached } from "./cache";
import { provider as defaultProvider, type Provider } from "./provider";
import { recordEvent } from "../events";

export type GatewayResult<T> =
  | { ok: true; data: T; costUsd: number; cached: boolean }
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
  const activeProvider = opts?.provider ?? defaultProvider;
  const budgetOpts = { baseDir: opts?.baseDir, caps: opts?.caps };
  const eventOpts = { ventureId: opts?.ventureId, baseDir: opts?.baseDir };

  const prompt = task.prompt(input as never);

  // Resolve tier via the budget guard BEFORE touching the provider or the
  // cache — a blocked call must never reach either.
  let tier: Tier = task.tier;
  for (;;) {
    const estimated = estimateCost(tier, prompt.length, task.expectedOutTokens);
    const decision = await budget.preflight(estimated, budgetOpts);

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

  const modelId = MODELS[tier].id;

  // Cache is keyed on the RESOLVED tier's model, not the task's preferred
  // tier — a downgraded (cheaper, lower-quality) answer must never be
  // returned later under a preferred-tier lookup once budget recovers.
  const key = cacheKey(taskName, modelId, prompt);
  const hit = await getCached<T>(key, { baseDir: opts?.baseDir });
  if (hit !== null) {
    return { ok: true, data: hit, costUsd: 0, cached: true };
  }

  let completion;
  try {
    completion = await activeProvider.complete(prompt, modelId, taskName);
  } catch {
    return { ok: false, reason: "provider_error", message: MESSAGES.provider_error() };
  }
  await budget.record(
    {
      task: taskName,
      model: modelId,
      promptTokens: completion.promptTokens,
      completionTokens: completion.completionTokens,
      costUsd: actualCost(tier, completion.promptTokens, completion.completionTokens),
      cached: false,
      ventureId: opts?.ventureId ?? null,
    },
    { baseDir: opts?.baseDir }
  );

  let parsed = safeParseJson<T>(task.schema as z.ZodType<T>, completion.text);

  if (!parsed.success) {
    const repairPrompt = `${prompt}\n\nYour previous response was invalid: ${parsed.error}. Respond again with ONLY valid JSON matching the schema.`;

    let repair;
    try {
      repair = await activeProvider.complete(repairPrompt, modelId, taskName);
    } catch {
      return { ok: false, reason: "provider_error", message: MESSAGES.provider_error() };
    }
    await budget.record(
      {
        task: taskName,
        model: modelId,
        promptTokens: repair.promptTokens,
        completionTokens: repair.completionTokens,
        costUsd: actualCost(tier, repair.promptTokens, repair.completionTokens),
        cached: false,
        ventureId: opts?.ventureId ?? null,
      },
      { baseDir: opts?.baseDir }
    );

    parsed = safeParseJson<T>(task.schema as z.ZodType<T>, repair.text);
    if (!parsed.success) {
      return { ok: false, reason: "invalid_output", message: MESSAGES.invalid_output() };
    }

    await putCached(key, parsed.data, { baseDir: opts?.baseDir });
    const cost = actualCost(tier, completion.promptTokens, completion.completionTokens) +
      actualCost(tier, repair.promptTokens, repair.completionTokens);
    return { ok: true, data: parsed.data, costUsd: cost, cached: false };
  }

  await putCached(key, parsed.data, { baseDir: opts?.baseDir });
  return {
    ok: true,
    data: parsed.data,
    costUsd: actualCost(tier, completion.promptTokens, completion.completionTokens),
    cached: false,
  };
}
