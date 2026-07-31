# EXECUTION STATE

**Sonnet 5: this is the file you read first every session and update last.**

---

## Current phase

**PHASE 11 — Immune System** — not started

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
| 08.5 | Primitives (Decision/Prediction/Observation) | ✅ done | `8b24c2b` | lesson |
| 09 | Growth Stage | ✅ done | `8a447d4` | ship |
| 10 | Build-in-Public Engine | ✅ done | `PENDING` | ship, lesson |
| 11 | Immune System | ⬜ | — | — |
| 12 | Ship It | ⬜ | — | — |
| 13 | Calibration | ⬜ | — | — |

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

### Phase 08.5 — Primitives (from docs/reviews/2026-07-30-stack-position.md)
Files: src/lib/domain.ts (Decision/Prediction/Observation, AiCall.reserved),
src/server/db/repositories/{decisions,predictions,observations}.ts (new),
aiCalls.ts (update()), src/server/ai/{budget,gateway}.ts (reserve/reconcile,
2x preflight, provenance fields), src/server/predictions/
extractPredictions.ts (new), src/server/ventures/recordDecision.ts (new),
{validateAndAdvance,planAndAdvance,generateBuildSpec,generateLandingPage,
regenerateArtifact}.ts (wired), src/components/venture/artifacts/
DecisionProvenance.tsx (new), app/ventures/[id]/page.tsx.
Risk: the reserve-before/reconcile-after change to every gateway call path
touches the budget guard, the single most safety-critical piece of code in
the project -- mitigated by walking every existing gateway/budget test by
hand against the new preflight math before running them, then adding
dedicated tests for the crash-survival case (§6.2) and the 2x-preflight case
(§6.1) rather than trusting the existing suite to incidentally cover new
behavior it was never written to check.

### Phase 09 — Growth Stage
Files: src/lib/domain.ts (Calendar/PostDraft/WeeklyReview schemas, ArtifactKind
additions), src/server/ai/tasks/{write-content-calendar,write-post,
weekly-review}.ts + fixtures, src/server/db/repositories/{predictions,
observations}.ts (get()), src/server/ventures/{generateContentCalendar,
generatePost,runWeeklyReview,resolvePrediction}.ts (new), src/app/api/
ventures/[id]/{content-calendar,posts,observations,weekly-review,
predictions/[predictionId]/resolve}/route.ts (new), src/components/venture/
artifacts/ContentCalendarArtifact.tsx (new), GrowthPanel.tsx (new),
app/ventures/[id]/page.tsx.
Risk: the channel-subset check (calendar channels must come from the plan's
ICP `where`) can't live in the static zod schema, since the schema doesn't
see the call's input -- mitigated by validating it as a post-hoc check in
generateContentCalendar.ts against the actual plan.icp.where list, same
place the "missing_prerequisite" check already lives, and testing with a
fixture that deliberately diverges.

### Phase 10 — Build-in-Public Engine
Files: src/server/content/{selectStory,git,drafts,generateBuildInPublicPost,
renderBuildInPublicPost}.ts (new), src/server/ai/tasks/write-buildinpublic.ts
+ fixture, src/lib/domain.ts (BuildInPublicPostSchema), src/server/db/store.ts
(readRepoFile/writeRepoFile/listRepoDir/moveRepoFile/deleteRepoFile), src/app/
api/content/** (new), src/app/content/page.tsx + ContentInbox.tsx (new),
docs/workflow/PROTOCOL.md §4 (rewritten), docs/content/README.md (rewritten),
docs/content/templates/ (deleted).
Risk: docs/content/ lives in the tracked repo tree, not `.nucleus/`, and
`tests/boundaries.test.ts` restricts `node:fs` to `store.ts` alone --
mitigated by extending store.ts with a second, `repoRoot`-scoped file family
(distinct from the existing `baseDir`-scoped one) rather than adding a new
fs-importing module, keeping the "one fs chokepoint" rule intact. Realized
risk during browser verification, not caught by any test: a Playwright
locator using `.first()` against the drafts list hit a real hand-written
post instead of the freshly generated one (both sorted to the top by
filename), and the reject step deleted the real `2026-07-31-phase-09-ship.md`
-- recovered via `git checkout`, then re-ran verification scoped to the
specific draft's filename. No code bug; a testing-methodology lesson about
`/content` specifically, where "newest" isn't the same as "the one I just
generated" once real content already exists.

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

### 2026-07-30 · Primitives · Budget reserves 2x, not a second preflight
Chose: `runTask`'s tier-selection loop preflights `estimated * 2`, and the
gateway reserves a ledger row (at the estimate) before every provider call,
reconciling it to actual cost after.
Over: adding a second `preflight()` call specifically before the repair-retry
completion.
Because: `docs/reviews/2026-07-30-stack-position.md` §6.1 named both options
and called the doubled-preflight the simpler one -- one check instead of two,
and it structurally guarantees the repair path (which was previously
unguarded entirely) can never push spend past the cap.
Revisit if: the doubling proves measurably too conservative in practice
(tasks downgrading tier more often than the repair path actually fires).

### 2026-07-30 · Primitives · Predictions auto-extract only from successMetric
Chose: `extractPredictions()` (pure function, no AI call) only turns
`Plan.successMetric` into a tracked `Prediction` -- not `Plan.killCriteria` or
`MvpScope.riskiestAssumption`, despite the review's §3.1 table listing all
three as falsifiable claims.
Over: inventing a `resolveBy` date for the two prose fields so all three
could be auto-extracted uniformly.
Because: `successMetric` is the only one of the three with a real
model-supplied date (`{metric, target, by}`); killCriteria and
riskiestAssumption are prose with no stated deadline, and fabricating one
would be exactly the "provenance field that lies" failure mode the review
flags elsewhere (§6.3). `Prediction.source` keeps a `"user"` variant open for
turning those into dated predictions manually later.
Revisit if: a review-window policy exists (BACKLOG.md) that gives those two
fields a real, non-fabricated date.

### 2026-07-30 · Primitives · promptVersion hashes the function, not the call
Chose: `promptVersion` is `sha256(task.prompt.toString()).slice(0,12)` --
a hash of the prompt-generating function's source, computed once per task,
stable across every venture and every input.
Over: hashing the fully-rendered, per-call prompt string (the one actually
sent to the model).
Because: the entire point of the field is answering "did editing this prompt
change the output" (review §5.5) -- a hash of the rendered string is unique
per call regardless of whether the template changed, which answers a
different (uninteresting) question. Hashing the function source changes only
when a developer actually edits the prompt.
Revisit if: never, without a reason stronger than "it was easy to compute
differently" -- this is the field's whole reason to exist.

### 2026-07-30 · Primitives · Decision backfill happens on read, not a migration script
Chose: `decisionsRepo.listByVenture()` lazily creates a backfilled Decision
(`modelId: "unknown"`) for any artifact that doesn't have one yet, the moment
that venture's decisions are next read.
Over: a one-time migration command run once across `.nucleus/`.
Because: it needs no new CLI surface, no "did I remember to run the
migration" failure mode, and reads are already the natural trigger point (the
workspace page) -- the review's own phrasing ("backfill... on first read")
specified this mechanism directly.
Revisit if: the artifact count per venture grows large enough that the
missing-decision scan on every read becomes a measurable cost (unlikely --
the same scan the workspace page already does for the artifact list itself).

### 2026-07-31 · Growth Stage · Channel drift is caught after the call, not in the schema
Chose: `generateContentCalendar.ts` checks every `channels[].channel` and
`posts[].channel` the model returns against the plan's actual
`plan.icp.where` list, after `runTask` succeeds, treating a mismatch as
`invalid_output`.
Over: trying to express the constraint inside `CalendarSchema` itself.
Because: a `TaskDef.schema` is defined once, statically, with no access to
the specific call's input -- there's no zod construct that can check "this
field's value must be a member of that other, per-call array." The
application-level check is the only place that actually sees both.
Revisit if: zod ever supports schema factories keyed on call-time context, in
which case this could move into the schema and gain a friendlier error
message.

### 2026-07-31 · Growth Stage · Prediction resolution is a value/target comparison, not a UI toggle
Chose: `resolvePrediction()` computes `hit` when the matched Observation's
`value >= Prediction.target`, `missed` when it's lower, and `void` when
either side has no number (a note-only entry, or a target-less prediction) --
never a human picking the verdict from a dropdown.
Over: letting the founder mark a prediction hit/missed by hand after looking
at the numbers.
Because: the whole point of a falsifiable claim is that resolving it isn't a
judgment call -- see docs/reviews/2026-07-30-stack-position.md §5.2. A human
choosing the verdict re-introduces exactly the self-serving fudging the
Prediction/Observation split was built to remove.
Revisit if: a metric genuinely needs a non-numeric resolution rule (e.g.
"shipped" as a boolean) -- add a resolution strategy per metric type then,
not a manual override.

### 2026-07-31 · Growth Stage · content_post and weekly_review skip the generic artifact list
Chose: unlike `content_calendar`, the `content_post` and `weekly_review`
artifact kinds are registered in `ArtifactKindSchema` but never added to
`KIND_ORDER` in the venture workspace page -- they're only ever rendered
through `GrowthPanel`, never through the generic `ArtifactRenderer` grouping.
Over: giving every kind, including up to 12 near-duplicate posts and each
weekly review run, its own card in the main artifact list, matching the "one
file, one case" comment in `artifacts/index.tsx` literally.
Because: `BuildStagePanel` and `LaunchPanel` already establish the precedent
that a stage's *actions* live in a dedicated panel while the generic list
stays for informational artifacts -- 12 posts and a growing pile of weekly
reviews would drown the plan/mvp_scope/landing_page cards a founder actually
needs to re-read.
Revisit if: a founder wants to browse old post drafts or past weekly reviews
outside the Growth panel -- add a collapsed history section there, not to
the main list.

### 2026-07-31 · Build-in-Public · Story selection is a weighted sum, no AI
Chose: `selectStory()` scores events/predictions with a fixed weight table
(killed verdict / missed prediction = 100, stage transition / budget guard /
deploy = 70, everything else = 0) and returns the top-N -- entirely pure,
zero model calls.
Over: asking the model to pick the interesting events as part of the same
generation call that writes the post.
Because: editorial judgment is exactly the kind of logic that degrades
silently if untested, and a model call inside the selection step makes "did
it pick the right story" untestable without reading every output by hand. A
weighted sum is one file, TDD'd, free to run on every generation.
Revisit if: the weights prove wrong for a real founder's actual audience --
add a "something failed and recovered" signal once a real event exists for
it (none does yet; gateway.ts doesn't currently record an event for a
provider_error or invalid_output that later succeeds).

### 2026-07-31 · Build-in-Public · Self-documentation posts create no Artifact
Chose: `generateBuildInPublicPost({mode:"self"})` writes a draft file
directly; it never creates an `Artifact` or a `Decision` row, unlike every
other AI-generated output in this app.
Over: forcing self-doc posts through the same `artifacts.create()` +
`recordDecision()` pipeline every venture-tied generation uses, for
consistency.
Because: `Artifact.ventureId` and `Decision.ventureId` are non-nullable --
there is no venture to attach a "Nucleus wrote about itself" post to, and
inventing one would fabricate provenance, the exact failure mode
docs/reviews/2026-07-30-stack-position.md §6.3 already named and this
project has avoided everywhere else. The AI call itself is still budgeted
and ledgered normally; only the artifact/decision bookkeeping is skipped.
Revisit if: self-doc posts need their own history/versioning beyond what the
markdown file list in docs/content/drafts/ already provides.

### 2026-07-31 · Build-in-Public · docs/content/ gets its own fs root in store.ts
Chose: `store.ts` gained a second family of functions (`readRepoFile`,
`writeRepoFile`, `listRepoDir`, `moveRepoFile`, `deleteRepoFile`) scoped to
an injectable `repoRoot` (defaulting to `process.cwd()`), separate from the
existing `baseDir`-scoped `.nucleus/` collection functions.
Over: adding a second fs-importing module for content specifically, or
loosening `tests/boundaries.test.ts`'s "only store.ts imports node:fs" rule.
Because: docs/content/ is tracked in git, not user data under `.nucleus/` --
a fundamentally different root -- but the "one fs chokepoint" rule the
boundary test enforces is worth keeping regardless of how many roots that
one chokepoint needs to know about.
Revisit if: a third fs root is ever needed -- generalize to a named-root
registry then, not before.

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
