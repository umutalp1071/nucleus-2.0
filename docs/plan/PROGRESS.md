# EXECUTION STATE

**Sonnet 5: this is the file you read first every session and update last.**

---

## Current phase

**PHASE 09 — Growth Stage** — not started

---

## Phase status

| # | Phase | Status | Commit | Posts |
|---|---|---|---|---|
| 00 | Ground Truth | ✅ done | `18b1f98` | ship, lesson |
| 01 | Domain & Storage | ✅ done | `b4484e4` | ship, lesson |
| 02 | AI Gateway | ✅ done | `7a0cf38` | ship, lesson |
| 03 | Real Validation | ✅ done | `3442e4b` | ship, lesson |
| 04 | Venture Workspace | ✅ done | `8b22f39` | ship, lesson |
| 05 | Budget Console | ✅ done | `62f4131` | ship, lesson |
| 06 | Planning Stage | ✅ done | `e9fd86b` | ship, lesson |
| 07 | Build Stage | ✅ done | `d1e025e` | ship, lesson |
| 08 | Launch Stage | ✅ done | `e908317` | ship, lesson |
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

### Phase 03 — Real Validation
Files: src/lib/domain.ts (Verdict/Competitors schemas moved here),
src/server/ai/tasks/{validate-idea,analyze-competitors}.ts,
src/server/ventures/validateAndAdvance.ts,
src/app/api/ventures/[id]/advance/route.ts, NewIdeaFlow.tsx (rewritten),
NewIdeaCard.tsx, page.tsx, mock-data.ts (generateMockAnalysis removed).
Risk: Verdict/Competitors types living under src/server/ai/tasks/ would have
been a boundary violation the moment the client-side result screen needed
them — resolved by moving the zod schemas into src/lib/domain.ts (client-safe)
and having the server tasks import back from there, before writing any UI
code that would have needed a workaround.

### Phase 04 — Venture Workspace
Files: src/app/ventures/[id]/page.tsx, src/components/venture/*,
src/components/dashboard/{VenturesCard,BottomRow,DashboardHeader,ThemeToggle,ui}.tsx,
src/app/api/{budget,artifacts}/route.ts, src/lib/{format,stages}.ts,
src/lib/idea-export.ts (rewritten against Venture), mock-data.ts (deleted),
ActiveProjectsCard.tsx + SavedIdeasCard.tsx (deleted, replaced by
VenturesCard.tsx).
Risk: Badge was hard-coupled to mock-data.ts's ProjectStatus type, which
would have blocked deleting that file entirely — generalized to a
StageTone-based Badge before deleting mock-data.ts, not after, so the app was
never in a broken intermediate state.

### Phase 05 — Budget Console
Files: src/app/settings/page.tsx, src/app/api/settings/**,
src/app/api/budget/breakdown/route.ts, src/server/ai/provider.ts (dynamic key
resolution), src/server/ai/gateway.ts (demo/downgraded flags), src/server/redact.ts,
src/components/settings/Sparkline.tsx, src/lib/budgetStatus.ts, domain.ts
(Artifact.demo field).
Risk: provider.ts's static `export const provider` singleton had to become a
dynamic `resolveProvider()` for a key added in Settings to take effect without
a restart — a real architectural change, not just additive UI. Verified with
curl end-to-end (set a fake key, confirm aiMode flips; set a near-zero cap,
confirm block; raise it, confirm the very next request succeeds) rather than
trusting the code reading correctly.

### Phase 06 — Planning Stage
Files: src/lib/domain.ts (Plan/MvpScope schemas), src/server/ai/tasks/
{plan-venture,scope-mvp}.ts, src/server/ventures/{planAndAdvance,
regenerateArtifact}.ts, src/app/api/ventures/[id]/{advance,regenerate}/route.ts,
src/components/venture/artifacts/{PlanArtifact,MvpScopeArtifact,
RegenerateControl}.tsx, src/app/ventures/[id]/page.tsx (kind-grouped display,
older versions collapsed), VentureActions.tsx (Advance to Planning enabled).
Risk/catch: browser verification of dark mode on the venture workspace page
surfaced a real cross-page bug — the theme class was only ever applied by
ThemeToggle's own mount effect, and the workspace/settings pages don't render
DashboardHeader at all, so dark mode silently reset to light off the
dashboard. Fixed by moving theme application into a blocking inline script in
the root layout's <head> (also incidentally fixes the flash-of-wrong-theme
noted as a known gap back in Phase 04) — verified with a genuinely fresh hard
navigation to /settings, not a client-side back-navigation that could have
masked the bug.

### Phase 07 — Build Stage
Files: src/lib/domain.ts (BuildTask/BuildSpec schemas, Venture.buildUrl),
src/lib/build-spec-export.ts (new), src/server/db/repositories/buildTasks.ts
(new), src/server/ventures/{startBuilding,generateBuildSpec}.ts (new),
src/server/ai/tasks/generate-build-spec.ts, src/app/api/ventures/[id]/{advance,
build-spec,tasks/[taskId]}/route.ts, src/components/venture/BuildStagePanel.tsx
(new), src/components/venture/artifacts/BuildSpecArtifact.tsx (new).
Risk: the milestone-to-task expansion looks trivial but "milestone" the field
already means two different things (MvpScope's structured milestone objects
vs. a plain grouping label on BuildTask) — mitigated by keeping the mapping
1 milestone -> 1 task literally (no invented sub-tasks, no AI), so the data
transformation stays honest to what "no AI call" means.

### Phase 08 — Launch Stage
Files: src/lib/domain.ts (LandingSchema, Venture.launchUrl/emailCaptureUrl),
src/server/ai/tasks/write-landing-page.ts, src/server/launch/template.ts (new),
src/server/deploy/{index,mock,vercel}.ts (new), src/server/db/store.ts
(raw-file write for the mock deploy target), src/server/ventures/
{generateLandingPage,deployLandingPage}.ts (new), regenerateArtifact.ts
(extended for landing_page), src/app/api/ventures/[id]/{landing-page,deploy,
preview}/route.ts (new), src/components/venture/artifacts/LandingArtifact.tsx
(new), LaunchPanel.tsx (new).
Risk: the model returning raw HTML instead of structured copy is the whole
phase's central risk — mitigated by never sending the model's output to the
DOM without a schema parse first, and by the template being the only place
`dangerouslySetInnerHTML`-equivalent string interpolation happens, escaped
unconditionally, tested with a literal `<script>` payload before anything
else ships.

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

### 2026-07-29 · Build Stage · One milestone equals one task
Chose: `planned -> building` maps each MVP milestone 1:1 to a BuildTask
(`milestone: m.name, title: m.outcome`), with zero AI calls.
Over: prompting a model to expand each milestone into several finer-grained
sub-tasks.
Because: the milestone objects already contain the content a task needs; a
model call here would pay to reformat data already on disk and introduce
nondeterminism into what should be a pure function. Guarded by a test that
mocks `runTask` and asserts it is never called.
Revisit if: users repeatedly ask for finer-grained checklists than 3-6 items
per venture.

### 2026-07-29 · Build Stage · Agent brief tested before shipping
Chose: rendered a real `generate-build-spec` fixture through
`buildSpecToAgentBrief` and read it as a fresh coding agent would, before
writing the ship post.
Over: trusting the schema/format design without running it.
Because: the first draft named "auto-organizes" as a differentiator with no
stated mechanism, and defined a `User` entity with no sign-in screen -- both
would have left a real coding agent guessing. Fixed by adding two explicit
requirements to the `generate-build-spec` prompt (name the mechanism behind
any "automatic" claim; a User-shaped entity requires a sign-in screen) and
updating the demo fixture to match.
Revisit if: a future model provider makes these omissions common again --
worth a schema-level check, not just a prompt instruction.

### 2026-07-29 · Build Stage · Launch gating lives in the route, not a workflow engine
Chose: `building -> launched` checks build-task completion inline in the
advance route (409 + `reason: "tasks_incomplete"` unless `skipRemaining` is
set), with the client showing a plain `window.confirm`.
Over: a generic workflow/approval engine, or silently allowing the
transition.
Because: the stage machine's honesty is the point -- a half-built venture
must never be silently marked launched -- and one conditional in one route is
the smallest thing that enforces that.
Revisit if: more stage transitions need similar gating (extract a shared
helper only then, not preemptively).

### 2026-07-30 · Launch Stage · Copy is structured, HTML is templated
Chose: `write-landing-page` returns a schema-validated copy object (headline,
subhead, 3 benefits, FAQ, SEO fields, all length-capped); a hand-written
`renderLandingPage` template is the only code that ever emits HTML, with
every interpolated value escaped unconditionally.
Over: asking the model for a full HTML page directly.
Because: raw HTML from a model is unvalidatable -- zod can check a JSON
shape, not that markup is safe, accessible, or well-formed -- and the venture
description feeding the prompt is user input, so an unescaped model output is
a live XSS hole. The template guarantees one `h1`, zero external requests,
and full escaping every time, rather than depending on the model remembering
to be safe.
Revisit if: users repeatedly ask for visual variety across pages -- template
variants belong in BACKLOG.md, not a relaxed escaping rule.

### 2026-07-30 · Launch Stage · Publish is gated behind a review checkbox
Chose: the "Publish" button in `LaunchPanel` stays disabled until the founder
checks "I've reviewed the preview above."
Over: enabling it as soon as landing copy exists, or auto-deploying right
after generation.
Because: deploying is a one-way door -- once live (especially on Vercel) the
page is a public artifact -- and model output has, at that point, never been
seen by a human. One checkbox is the smallest thing that forces a look before
publish, matching the phase risk "user deploys something embarrassing."
Revisit if: never, without a stronger reason than convenience -- this is the
cheapest possible guard against the phase's stated worst-case.

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
