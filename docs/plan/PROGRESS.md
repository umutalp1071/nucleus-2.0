# EXECUTION STATE

**Sonnet 5: this is the file you read first every session and update last.**

---

## Current phase

**PHASE 03 — Real Validation** — not started

---

## Phase status

| # | Phase | Status | Commit | Posts |
|---|---|---|---|---|
| 00 | Ground Truth | ✅ done | (pending push) | ship, lesson |
| 01 | Domain & Storage | ✅ done | (pending push) | ship, lesson |
| 02 | AI Gateway | ✅ done | (pending push) | ship, lesson |
| 03 | Real Validation | ⬜ | — | — |
| 04 | Venture Workspace | ⬜ | — | — |
| 05 | Budget Console | ⬜ | — | — |
| 06 | Planning Stage | ⬜ | — | — |
| 07 | Build Stage | ⬜ | — | — |
| 08 | Launch Stage | ⬜ | — | — |
| 09 | Growth Stage | ⬜ | — | — |
| 10 | Build-in-Public Engine | ⬜ | — | — |
| 11 | Immune System | ⬜ | — | — |
| 12 | Ship It | ⬜ | — | — |

Legend: ⬜ not started · 🟡 in progress · ✅ done · 🚧 blocked

---

## Plan of record

*Before starting a phase, append a 5-line block here: files you'll touch, and
the risk you consider most likely. This is the pre-mortem lesson #7 requires.
Keep it short.*

### Phase 00 — Ground Truth
Files: package.json, vitest.config.ts, src/server/config.ts, tests/*,
.github/workflows/ci.yml, .gitignore, docs/MASTER_PLAN.md (banner).
Risk: boundary test regexes give false positives/negatives on real code later
— mitigated by actually breaking the test on purpose and watching it fail
before trusting it (see learning.md).

### Phase 01 — Domain & Storage
Files: src/lib/domain.ts, src/lib/stages.ts, src/server/db/store.ts,
src/server/db/repositories/*, src/server/events.ts, src/app/api/ventures/**,
src/app/api/events/route.ts, src/app/page.tsx, SavedIdeasCard.tsx,
idea-export.ts (decoupled), idea-storage.ts (deleted).
Risk: the localStorage-migration effect double-firing (React 18 dev
double-invoke or a stray reload) creating duplicate ventures — caught in
verification (see learning.md), root cause was a test-script bug not an app
bug, but worth remembering as a real risk pattern for any future
migration-on-mount code.

### Phase 02 — AI Gateway
Files: src/server/ai/{models,budget,provider,cache,gateway}.ts,
src/server/ai/tasks/index.ts, src/server/ai/fixtures/index.ts,
src/app/api/health/route.ts.
Risk: cost estimation drifting from actual provider pricing over time —
mitigated by a dated comment on the pricing table now, a Phase 11 staleness
check later. Also caught mid-phase: Next.js statically optimized the
GET-only /api/health route (no dynamic Request API usage), which would have
frozen spend/ventureCount at build time — fixed with `export const dynamic =
"force-dynamic"`.

---

## Decisions log

Format — one entry per non-obvious decision, appended, never edited:

```
### YYYY-MM-DD · Phase NN · [decision in five words]
Chose: ...
Over: ...
Because: ...
Revisit if: ...
```

### 2026-07-28 · Planning · Venture copilot, not codegen
Chose: AI does validation → planning → launch page → growth; the product's own
source code is not generated.
Over: full autonomous idea-to-deployed-SaaS.
Because: competing with VC-funded app builders on $50/month and one person
ships nothing for a year, which is how 1.0 died. The unserved gap is
everything *around* the app.
Revisit if: the copilot loop is complete, has real users, and codegen is the
top request.

### 2026-07-28 · Planning · JSON files, not Supabase
Chose: local JSON under `.nucleus/`.
Over: Supabase Postgres (which `CONTEXT.md` originally specified).
Because: (1) the vision says "their own computer, under their own control" and
a file is literally that; (2) zero setup means people actually try it;
(3) an AI agent executing this plan cannot create a Supabase project, so a
cloud dependency would stall execution on a human.
Revisit if: multi-user arrives, or a single collection exceeds ~10k rows.

### 2026-07-28 · Planning · BYOK, always
Chose: the user supplies their own OpenRouter key; caps govern their spend.
Over: a Nucleus-hosted key with quotas.
Because: zero marginal cost, no billing infra, no abuse surface, and it is the
literal implementation of "under their own control."
Revisit if: a hosted tier is ever offered.

### 2026-07-28 · Planning · Mock adapters are permanent
Chose: AI provider and deploy target each have a deterministic fake, selected
by the absence of a key.
Over: requiring credentials to run anything.
Because: it is simultaneously the test infrastructure, the zero-setup demo
mode, and the thing that lets this plan be executed autonomously.
Revisit if: never. Deleting these breaks all three.

---

## Dependency ledger

Every `npm install` gets a row. No exceptions.

| Package | Runtime/Dev | Phase | Why nothing else does it |
|---|---|---|---|
| `zod` | runtime | 00 | Runtime validation of LLM output + env. Hand-rolled validators for ~10 nested schemas is more code and worse errors. |
| `vitest` | dev | 00 | Test runner. No stdlib equivalent. |

Pre-rejected, do not add without a very good reason: any state manager, any
component library, any ORM, any HTTP client (use `fetch`), the OpenAI SDK
(OpenRouter is OpenAI-compatible REST), `playwright` (agent tooling — scratchpad
only, see the `run-dashboard` skill).

---

## Blocked

*If something genuinely cannot proceed, add an entry here with the precise
question, then move to the next unblocked phase. Never stall waiting.*

```
### Phase NN — [what's blocked]
Question: [exact question for the founder]
Tried: [what you attempted]
Workaround in place: [what you did instead, if anything]
Unblocks: [which phases depend on this]
```

---

## Vision drift checks

*Phase 11 automates this. Until then, record a manual check every 4 phases.*

| Date | After phase | Score | Note |
|---|---|---|---|
| — | — | — | — |
