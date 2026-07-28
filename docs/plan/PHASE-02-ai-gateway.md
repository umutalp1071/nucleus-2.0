# PHASE 02 — THE AI GATEWAY

**Goal:** one function through which every AI call in Nucleus, forever, must
pass — and which cannot breach the budget.

**Why now:** this is the phase that makes Nucleus defensible. Six cross-cutting
concerns (budget, cache, routing, validation, retries, logging) either live in
one file or become six rules every future call site has to remember. Build it
before there is a second call site.

**If time is ever short in this project, protect this phase. Everything else
is surface.**

---

## Scope

**In:** provider abstraction (mock + openrouter), model/pricing table, cost
estimation, budget preflight + ledger, task registry, schema validation with
repair retry, content-hash cache, `runTask`.

**Out of scope:** any real task prompt beyond one trivial one used for testing
(`validate-idea` is Phase 03). Any UI. The settings page (Phase 05). Streaming.
Queues. Rate limiting beyond the budget guard.

---

## Steps

### 1. Model table (`src/server/ai/models.ts`)

```ts
export type Tier = "cheap" | "mid" | "frontier";

export const MODELS: Record<Tier, { id: string; inUsdPerM: number; outUsdPerM: number }> = {
  cheap:    { id: "meta-llama/llama-3.1-8b-instruct", inUsdPerM: 0.02, outUsdPerM: 0.03 },
  mid:      { id: "anthropic/claude-haiku-4.5",       inUsdPerM: 1.00, outUsdPerM: 5.00 },
  frontier: { id: "anthropic/claude-sonnet-5",        inUsdPerM: 3.00, outUsdPerM: 15.00 },
};

export const TIER_ORDER: Tier[] = ["cheap", "mid", "frontier"];
export function estimateCost(tier: Tier, promptChars: number, expectedOutTokens: number): number;
export function actualCost(tier: Tier, inTok: number, outTok: number): number;
```

Estimation: `promptChars / 4` for input tokens (documented approximation),
`expectedOutTokens` declared per task. Round **up**. An estimate that
underestimates is a budget breach; one that overestimates is a slightly early
refusal. Bias toward the safe error.

Pricing changes over time — one table, one place, and a comment with the date
it was last checked.

**TDD required.** `tests/models.test.ts`: known token counts → known dollar
amounts; estimation never returns less than actual for the same token counts.

### 2. Budget (`src/server/ai/budget.ts`)

```ts
export interface Caps { daily: number; weekly: number; monthly: number }
export const DEFAULT_CAPS: Caps = { daily: 10, weekly: 30, monthly: 50 };

export async function getSpend(): Promise<{ daily: number; weekly: number; monthly: number }>;
export async function preflight(estimatedUsd: number): Promise<
  { decision: "ok" } |
  { decision: "downgrade"; headroomUsd: number } |
  { decision: "block"; window: "daily"|"weekly"|"monthly"; capUsd: number; spentUsd: number }
>;
export async function record(call: Omit<AiCall, "id"|"createdAt">): Promise<void>;
```

Rules, all of which need tests:

- Spend is `SUM(costUsd)` over `aiCalls` within the window. **Never a stored
  counter.** Counters drift; drifted counters breach budgets.
- Windows: daily = since local midnight; weekly = since Monday 00:00 local;
  monthly = since the 1st. Use local time — the user's "today" is what matters.
- Block if `spent + estimated > cap` for **any** window.
- Return `downgrade` when the estimate exceeds remaining headroom but a
  cheaper tier would fit.
- `record()` is called even when the response fails to parse. **Tokens spent
  on a bad response are still tokens spent.** Forgetting this is the classic
  way a budget guard silently leaks money.

**TDD required.** `tests/budget.test.ts`, and these edge cases specifically:
exactly at the cap; one cent over; a call at 23:59 not counting toward
tomorrow; Sunday→Monday week rollover; empty ledger; a failed call still
recorded.

### 3. Provider (`src/server/ai/provider.ts`)

The **only** file in the repo permitted to reference the OpenRouter host.
The boundary test from Phase 00 enforces this.

```ts
export interface CompletionResult {
  text: string; promptTokens: number; completionTokens: number;
}
export interface Provider {
  complete(prompt: string, modelId: string): Promise<CompletionResult>;
}
```

`openrouter`: one `fetch` to `https://openrouter.ai/api/v1/chat/completions`.
No SDK. Read real token counts from `response.usage` — never re-estimate after
the fact when the truth is in the response.

`mock`: deterministic. Looks up a fixture by task name from
`src/server/ai/fixtures/`, returns it with a plausible token count derived
from the fixture length. Every fixture must satisfy its task's zod schema —
add a test that iterates the registry and asserts exactly that. A drifted
fixture is a test suite that passes while the product is broken.

```ts
export const provider: Provider = hasAiKey() ? openrouter : mock;
```

### 4. Task registry (`src/server/ai/tasks/index.ts`)

```ts
export interface TaskDef<I, O> {
  name: string;
  tier: Tier;
  minTier: Tier;            // gateway may downgrade to here, no lower
  expectedOutTokens: number;
  schema: z.ZodType<O>;
  prompt: (input: I) => string;
}
export const TASKS = { /* name → TaskDef */ } as const;
```

For this phase create exactly one task, `echo-check`, used only by tests. Real
tasks start in Phase 03.

### 5. Cache (`src/server/ai/cache.ts`)

Key: `sha256(taskName + modelId + prompt)` via `node:crypto`. Stored as a
collection through the repository layer, not a raw file. TTL 7 days.

Identical input must never be paid for twice. On a $50/month budget that is
not an optimization, it is a feature.

### 6. `runTask` (`src/server/ai/gateway.ts`)

Implement exactly the sequence in `ARCHITECTURE.md` §The AI gateway contract.
Points that are easy to get wrong:

- The repair retry re-renders the prompt with the zod error appended, and its
  cost is **also** recorded. Two attempts, then give up.
- A blocked call records a `budget.blocked` event with a readable summary.
- The returned `message` on failure is user-readable. Map internally:
  - `budget_exceeded` → "Nucleus has reached today's $10 spending limit. It
    resets at midnight."
  - `invalid_output` → "Nucleus couldn't make sense of that result. Try again."
  - `provider_error` → "The AI service isn't responding right now."
  No model names, no token counts, no HTTP status codes. That is the
  "freedom from needing to know" principle, enforced at the message layer.
- `runTask` never throws for an expected condition.

**TDD required.** `tests/gateway.test.ts` with a stub provider:
- happy path returns typed data and records one `aiCall`
- malformed output → repair retry → success, **two** calls recorded
- malformed twice → `{ ok:false, reason:"invalid_output" }`, two calls recorded
- budget blocked → provider **never called** (assert the stub's call count is
  zero — this is the single most important assertion in the file)
- downgrade path selects the cheaper tier and does not go below `minTier`
- cache hit → provider not called, `costUsd` 0, `cached: true`

### 7. Health route

`GET /api/health` → `{ ok, aiMode: "live"|"mock", deployMode, spend, caps,
ventureCount }`. Cheap, and it is what you screenshot for the Peerlist post.

---

## Acceptance

```bash
npm run verify
```

- All gateway tests above pass, including the zero-provider-calls assertion
- With **no** `OPENROUTER_API_KEY`: `curl localhost:3000/api/health` →
  `aiMode: "mock"`, and a `runTask` call returns valid typed data
- Every fixture validates against its task schema (registry-iterating test)
- `tests/boundaries.test.ts` still passes — nothing outside `provider.ts`
  mentions the OpenRouter host
- Temporarily set a `1`-dollar monthly cap in `.nucleus/settings.json`, run a
  task, confirm it blocks and writes a `budget.blocked` event. Revert.

---

## Risks

| Risk | Mitigation |
|---|---|
| Cost estimation is badly wrong, budget leaks | Round up; bias estimates high; a test asserts estimate ≥ actual for equal token counts |
| Retry storm multiplies cost | Hard cap of 2 attempts; both counted against the same budget |
| Fixtures drift from schemas | Registry-iterating validation test |
| Pricing table goes stale | Date comment + a Phase 11 health check that flags it after 90 days |
| Gateway grows into a god-module | It orchestrates only. Budget, cache, models, provider stay separate and independently tested |

---

## Peerlist posts

**A — SHIP:** *"My AI budget cap runs before the request, not after."*
The core idea, with the sequence diagram in text. The killer detail: the most
important test in the file asserts the provider was called **zero** times.
Show the `preflight` signature. Number: 3 model tiers, automatic downgrade,
$50/month that the system structurally cannot exceed.

**B — LESSON:** *"A dashboard that shows your spending is not a budget."*
The strongest post in the series — lead the phase with this one. Open on: by
the time the number turns red, the money is gone. Then the three-way
`ok | downgrade | block` decision, and why spend is derived by summing a
ledger rather than incrementing a counter (counters drift; a drifted counter
is a breached cap). The honest cost: you must estimate before you know, so you
sometimes refuse a call that would have fit. Rejected: post-hoc metering with
alerts — that's a smoke detector, not a sprinkler. Ask: has anyone shipped
real pre-flight LLM cost control, or does everyone just watch the graph?
