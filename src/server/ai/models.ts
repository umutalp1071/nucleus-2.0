export type Tier = "cheap" | "mid" | "frontier";

interface ModelSpec {
  id: string;
  inUsdPerM: number;
  outUsdPerM: number;
}

// Pricing last checked: 2026-07-28. Phase 11 adds a staleness check that
// flags this table if it goes unreviewed for 90 days — a stale price
// silently breaks the budget guard's estimates.
export const MODELS: Record<Tier, ModelSpec> = {
  cheap: { id: "meta-llama/llama-3.1-8b-instruct", inUsdPerM: 0.02, outUsdPerM: 0.03 },
  mid: { id: "anthropic/claude-haiku-4.5", inUsdPerM: 1.0, outUsdPerM: 5.0 },
  frontier: { id: "anthropic/claude-sonnet-5", inUsdPerM: 3.0, outUsdPerM: 15.0 },
};

export const TIER_ORDER: Tier[] = ["cheap", "mid", "frontier"];

function tokenCost(model: ModelSpec, inTok: number, outTok: number): number {
  return (inTok / 1_000_000) * model.inUsdPerM + (outTok / 1_000_000) * model.outUsdPerM;
}

// promptChars / 4 is a documented approximation for input tokens. Rounded UP
// so a fractional character count never underestimates — an estimate that's
// too low is a budget breach; one that's too high is a slightly early
// refusal. Bias toward the safe error.
export function estimateCost(tier: Tier, promptChars: number, expectedOutTokens: number): number {
  const inTokens = Math.ceil(promptChars / 4);
  return tokenCost(MODELS[tier], inTokens, expectedOutTokens);
}

export function actualCost(tier: Tier, inTok: number, outTok: number): number {
  return tokenCost(MODELS[tier], inTok, outTok);
}
