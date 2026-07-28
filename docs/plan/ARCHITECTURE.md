# TARGET ARCHITECTURE

The end state. Phases build toward this; nothing should contradict it.

---

## Directory layout

```
src/
  app/
    page.tsx                       dashboard — venture list, budget, activity
    ventures/[id]/page.tsx         venture workspace — timeline + artifacts
    settings/page.tsx              BYOK key, budget caps, export, danger zone
    api/
      ventures/route.ts            GET list, POST create
      ventures/[id]/route.ts       GET one, PATCH, DELETE
      ventures/[id]/advance/route.ts   POST — run the next stage's AI task
      budget/route.ts              GET current spend vs caps
      events/route.ts              GET activity feed
      health/route.ts              GET system self-check

  server/                          SERVER ONLY. Never imported by a client component.
    config.ts                      zod-validated env, single export `config`
    ai/
      gateway.ts                   runTask() — THE chokepoint
      provider.ts                  openrouter | mock. Only file that may fetch a model.
      models.ts                    tier → model + per-token pricing table
      budget.ts                    preflight guard + ledger write
      cache.ts                     content-hash → prior result
      tasks/
        index.ts                   task registry
        validate-idea.ts           prompt + zod schema + tier
        analyze-competitors.ts
        plan-venture.ts
        scope-mvp.ts
        write-landing-page.ts
        write-content.ts
        write-buildinpublic.ts
    db/
      store.ts                     atomic JSON file read/write primitive
      repositories/
        ventures.ts
        artifacts.ts
        events.ts
        aiCalls.ts
        settings.ts
    deploy/
      index.ts                     vercel | mock
    events.ts                      recordEvent() — the narrative spine

  lib/                             shared, client-safe. No node builtins.
    domain.ts                      Venture, Stage, Artifact, Event types + zod
    stages.ts                      stage order, labels, allowed transitions
    format.ts                      money, dates, relative time

  components/
    dashboard/                     existing cards, reworked around ventures
    venture/                       workspace, timeline, artifact renderers
    ui.tsx                         Card, Badge, ProgressBar, Button (existing)

.nucleus/                          runtime data. gitignored. user-owned.
  ventures.json
  artifacts.json
  events.json
  ai-calls.json
  settings.json
  backups/
```

---

## Module boundaries (enforced by test, not by discipline)

| Rule | Enforced in |
|---|---|
| `src/server/**` never imported from a `"use client"` file | `tests/boundaries.test.ts` |
| Only `server/ai/provider.ts` references the OpenRouter host | `tests/boundaries.test.ts` |
| Only `server/db/store.ts` touches `node:fs` | `tests/boundaries.test.ts` |
| `src/lib/**` imports no node builtins | `tests/boundaries.test.ts` |

Client components reach data through `/api/*` route handlers. Server
components may import repositories directly.

---

## Domain model

```ts
type Stage =
  | "captured" | "validated" | "planned"
  | "building" | "launched"  | "growing"
  | "killed"   | "archived";

interface Venture {
  id: string;
  title: string;
  description: string;          // the raw idea, as the user typed it
  stage: Stage;
  verdictScore: number | null;  // 0-100, set by validation
  createdAt: string;
  updatedAt: string;
}

interface Artifact {
  id: string;
  ventureId: string;
  kind: "validation" | "competitors" | "plan" | "mvp_scope"
      | "landing_page" | "content_calendar" | "build_spec";
  stage: Stage;                 // stage this was produced for
  content: unknown;             // shape guaranteed by the task's zod schema
  model: string;
  costUsd: number;
  createdAt: string;
}

interface NucleusEvent {
  id: string;
  ventureId: string | null;     // null = system-level event
  type: string;                 // "venture.advanced", "budget.blocked", ...
  summary: string;              // one human sentence. Feeds the activity feed.
  payload: unknown;
  createdAt: string;
}

interface AiCall {
  id: string;
  task: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  cached: boolean;
  ventureId: string | null;
  createdAt: string;
}
```

### Stage transitions

```
captured ─validate─▶ validated ─plan─▶ planned ─build─▶ building
                          │                                 │
                          ▼                              launch
                       killed                                │
                                                             ▼
                                            growing ◀─grow─ launched

any stage ──▶ archived
```

`stages.ts` owns the transition table. An illegal transition throws — the API
never trusts a client-supplied target stage.

---

## The AI gateway contract

```ts
// src/server/ai/gateway.ts
export async function runTask<T>(
  taskName: TaskName,
  input: Record<string, unknown>,
  opts?: { ventureId?: string }
): Promise<
  | { ok: true;  data: T; costUsd: number; cached: boolean }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error";
      message: string }   // message is USER-READABLE. No stack traces, no model names.
>
```

Sequence inside `runTask`:

```
1. resolve task definition (prompt template, zod schema, tier)
2. render prompt from template + input
3. cache lookup by hash(task + prompt + model) → hit? return, cost 0
4. budget.preflight(estimatedCost)
     → "block"    : return { ok:false, reason:"budget_exceeded" }, record event
     → "downgrade": drop one tier, re-estimate
     → "ok"       : proceed
5. provider.complete(prompt, model)
6. schema.safeParse(response)
     → fail: ONE retry with the validation error appended
     → fail again: return { ok:false, reason:"invalid_output" }
7. budget.record(actual tokens, actual cost)   // ALWAYS, even on parse failure
8. cache.put
9. return { ok:true, data }
```

**Never** does `runTask` throw for an expected condition. Callers branch on
`ok`; they do not write try/catch around business logic.

### Model tiers

```ts
// models.ts — prices are per 1M tokens, kept current in one place
cheap    → meta-llama/llama-3.1-8b-instruct     classification, formatting, summaries
mid      → anthropic/claude-haiku-4.5           most tasks: validation, planning, content
frontier → anthropic/claude-sonnet-5            only where reasoning depth pays: competitors, strategy
```

Degradation order is `frontier → mid → cheap`. A task declares its preferred
tier and its **minimum acceptable** tier; the budget guard may downgrade
within that range and no further.

### Budget

```ts
preflight(estimatedUsd) → "ok" | "downgrade" | "block"
```

Caps read from settings, defaults `{ daily: 10, weekly: 30, monthly: 50 }`.
Spend for each window is **`SUM(costUsd)` over `aiCalls` in that window**,
computed on demand. There is no counter to drift.

---

## Provider abstraction

Exactly two implementations, selected once at module load:

```ts
export const provider = config.OPENROUTER_API_KEY ? openrouter : mock;
```

`mock` returns deterministic, schema-valid fixtures keyed by task name, with a
realistic simulated token count. This is what makes the entire system runnable
and testable with no account and no key. It is not a stub to be deleted — it
is permanent test infrastructure and the zero-setup demo mode.

The deploy adapter follows the identical pattern (`vercel | mock`).

---

## Storage

`store.ts` is roughly forty lines: read a JSON file, write it atomically
(temp file + rename), keep the last N backups.

```
ponytail: whole-file rewrite per mutation, single process, no locking.
Ceiling ~10k rows / one writer. Upgrade path: swap store.ts for SQLite
(node:sqlite) or the Supabase adapter — repositories are the only callers.
```

Repositories are plain functions (`listVentures`, `getVenture`,
`createVenture`, …). No classes, no ORM, no query builder, no base repository.

---

## What is deliberately NOT here

Documented so nobody rebuilds them by accident:

- **No state management library.** Server components + route handlers + local
  `useState`. Prop drilling is two levels deep at worst.
- **No component library.** The four primitives in `ui.tsx` cover it. Radix
  arrives only if a real focus-trap need appears.
- **No ORM / migration tool.** JSON files. A version field on each file
  handles shape changes.
- **No auth.** Single operator. Phase 11 adds it if and when it is needed.
- **No queue / worker / cron.** AI tasks run inline in a request. If one grows
  past ~30s, that is the trigger to reconsider — not before.
- **No OpenAI SDK.** OpenRouter is an OpenAI-compatible REST endpoint; one
  `fetch` covers it.
- **No codegen.** Phase-4 seam. See `00-ANSWER.md` §2.
