# Session Learning Log

---

## 2026-07-30 — Architectural review implemented: Phase 08.5 (Primitives)

**What we did:**
Implemented `docs/reviews/2026-07-30-stack-position.md` end to end, following
its own narrow synthesis (§10/§11) rather than everything it discusses: added
three primitives to `domain.ts` -- `Decision` (provenance: real model id,
tier requested/used, downgraded/cached/demo, a prompt-version hash, upstream
`inputRefs`, and a human verdict), `Prediction` (a falsifiable claim with a
metric/target/date, extracted from `Plan.successMetric` by a pure function,
no AI call), and `Observation` (evidence, keyed to match a prediction's
metric so resolution is a join). Every venture service that creates an
artifact now also records a `Decision` and, for plans, any `Prediction`s its
content already contains -- closing the gap the review's §3.1 named directly:
the model was already being asked exactly the right questions
(`successMetric`, `killCriteria`, `riskiestAssumption`) and the answers were
rendered to a card and discarded. Fixed two real budget-guard defects found
during the review: the schema-repair retry path made a second, completely
unguarded provider call on top of an already-approved spend (§6.1, fixed by
preflighting 2x the estimate); and spend was only written to the ledger after
the provider call returned, so a crash in between silently lost it and
loosened the effective cap (§6.2, fixed with a reserve-before/reconcile-after
pattern -- the ledger row exists at the estimate the moment the call is
attempted, not after it succeeds). Also fixed the `Artifact.model` field,
which had been storing the task name instead of the actual model id since
Phase 03. The workspace now renders a provenance line under every artifact:
model, downgraded/cached badges, cost, how many upstream artifacts fed it,
and (once a regenerate happens) what the founder said was wrong with the
previous version.

**Decisions:**
- **Reserve 2x on preflight, not a second preflight call.** The review named
  both options and called this one simpler; one check instead of two, and it
  structurally covers the repair path that was previously unguarded.
- **`extractPredictions` only auto-extracts `Plan.successMetric`, not
  `killCriteria` or `riskiestAssumption`.** Those two are prose with no
  stated date; inventing one would be exactly the "provenance field that
  lies" failure mode the review itself flags for `Artifact.model`. Left as a
  BACKLOG trigger for when a review-window policy exists.
- **`promptVersion` hashes the prompt function's source, not the rendered
  per-call string.** The rendered string is unique per venture regardless of
  whether the prompt template changed, which defeats the field's entire
  purpose (detecting whether an edit to the prompt changed behavior).
- **Decision backfill happens lazily on read, not via a migration script.**
  No new CLI surface, no "did I remember to run it" failure mode -- the
  workspace page reading a venture's artifacts was already the natural
  trigger point.
- **Deferred, per the review's own counter-argument:** the eval harness,
  policy-as-data, and the marketing/positioning reframing all wait for real
  users, exactly as the review concludes in its §10. Only the three
  primitives and the two budget fixes were treated as "the deadline already
  passed if we don't do it now" (provenance cannot be retrofitted onto
  artifacts that already exist without instrumentation).

**Mistake caught mid-session:** writing `Venture.emailCaptureUrl`/`launchUrl`
in Phase 08 had already exposed that `ventures.create()` builds its return
object by hand and only calls `VentureSchema.parse()` for validation,
discarding the parsed (defaulted) result -- so new schema fields silently
come back `undefined` instead of their zod default unless the repository's
`create()` sets them explicitly. The same class of bug nearly recurred here:
a `deployLandingPage`-style test asserting `toBeNull()` on a fresh backfilled
Decision's `humanReason` would have caught a similar gap if `decisionsRepo`
didn't set every field explicitly in `backfill()` and `create()` -- it does,
but the pattern is now worth naming as a standing risk for every future
`.default()` field: the schema's default only fires through `.parse()`, never
through a hand-built object literal that happens to satisfy the input type.

**Next step:** Phase 09 — Growth Stage, re-shaped per the review (see
`PHASE-09-growth-stage.md`'s callout) to use `Observation` instead of the
originally-specced `MetricEntry`.

**Quality Score: 92/100**
- All acceptance criteria from the review's own migration plan (§8) met: the
  workspace renders the exact provenance sentence the review's Definition of
  Done specified, verified in a real browser against a venture driven through
  validate → plan in this session (not against stale fixture data); the
  crash-survival and 2x-preflight fixes each have a dedicated test that fails
  without the fix, not just incidental coverage from the existing suite.
- Docked for: the eval harness and calibration report (§5.5, now Phase 13)
  remain unbuilt, as the review itself directs -- but that also means the
  claim "the kill verdict is well-calibrated" is still unverified by anything
  other than reading the prose, which was the exact gap the review opened
  with. Correctly deferred, not yet closed.

---

## 2026-07-30 — Plan Phase 08: Launch Stage

**What we did:**
Added the Launch stage: a `write-landing-page` task returns schema-validated
copy only (headline, subhead, exactly 3 benefits, FAQ, CTA, SEO fields, all
length-capped) -- never HTML. A hand-written `renderLandingPage` template is
the sole place that emits markup, escaping every interpolated value
unconditionally. A `DeployTarget` adapter mirrors the AI provider's mock/real
pattern: `mock` writes `.nucleus/deploys/<id>/index.html` and returns a
`file://` URL with zero accounts; `makeVercelTarget` posts the inline file to
`/v13/deployments` and activates the moment `VERCEL_TOKEN` is set. The
workspace gained a `LaunchPanel`: generate/regenerate copy, an iframe preview
served fresh on every request from `/api/ventures/[id]/preview`, an email
capture URL field (falls back to a `mailto:` CTA when unset), a launch
checklist nudge (CTA set, SEO present, first-10-users pulled from the plan),
and a Publish button gated behind an explicit "I've reviewed this" checkbox.
`Venture` gained `emailCaptureUrl` and `launchUrl`; `regenerateArtifact` now
also handles `landing_page` feedback loops, reusing the existing control.

**Decisions:**
- **The model writes copy, a template writes HTML -- no exceptions.** The
  phase's central risk is XSS and unvalidatable markup from letting a model
  emit HTML directly; a zod schema can check a JSON shape but not that
  markup is safe, so the template stays the only HTML author, tested with a
  literal `<script>` payload in both the headline and the venture title.
- **Publish stays disabled until a review checkbox is checked.** Deploying is
  a one-way door once live; gating it behind one boolean is the cheapest
  guard against "user deploys something embarrassing" (the phase's own risk
  table), cheaper than any richer approval flow this project doesn't need.
- **Deploy failures leave the venture untouched.** `deployLandingPage`
  catches the target's throw and returns a readable message without writing
  `launchUrl` -- a half-launched venture is worse than an unlaunched one.

**Bug caught by a test, not a review:** `writeRawFile`'s mock deploy target
returned `path.join(dir, relPath)` as the "absolute" path to turn into a
`file://` URL. With the default `NUCLEUS_DATA_DIR` of `.nucleus` (a relative
path), that produced `file:///.nucleus/deploys/...` -- a URL that resolves
against the filesystem root, not the actual project directory. Caught by the
browser verification step (the returned link, opened for real, pointed at
nothing) rather than by reading the code, which looked correct at a glance.
Fixed with `path.resolve` instead of `path.join`, plus a regression test that
passes a relative `baseDir` and asserts the returned url is absolute.

**Also caught:** `ventures.create()` builds the venture object by hand and
only calls `VentureSchema.parse()` for validation, discarding the parsed
(defaulted) result -- the same pattern that already required `buildUrl: null`
to be listed explicitly in Phase 07. Adding `emailCaptureUrl` and `launchUrl`
to the schema alone left both `undefined` on newly created ventures until a
`deployLandingPage` test asserted `toBeNull()` and got `undefined` instead.

**Next step:** Phase 09 — Growth Stage.

**Quality Score: 90/100**
- All acceptance criteria met: escaping, one-`h1`, zero-external-request, and
  meta-description checks are real assertions against rendered output, not
  code-reading; the deploy failure path is tested to leave the venture
  unchanged; the relative-path bug was caught by actually opening the
  resulting link in a real browser rather than trusting the implementation.
- Docked for: the Vercel adapter's exact request/response shape (project
  `name`, `files[].encoding`, response `url` field) is a best-effort read of
  the public API with no live account to confirm against -- isolated to one
  function per the phase's own risk table, but genuinely unverified against
  a real Vercel deployment this session.

---

## 2026-07-29 — Plan Phase 07: Build Stage

**What we did:**
Added the Build stage: `planned -> building` expands each MVP milestone
1:1 into a checkable `BuildTask` (`milestone: name, title: outcome`) with
zero AI calls, guarded by a test that mocks the gateway's `runTask` and
asserts it is never invoked. A new `generate-build-spec` task produces the
handoff artifact -- user stories with acceptance criteria, a data model,
screens, an explicit out-of-scope list, and a literal first commit -- and one
"Copy for..." control renders it three ways (Markdown, an agent brief, and a
single paste-ready prompt for Lovable/v0/Bolt), copying to clipboard and
offering a download for each. The workspace page gained a `BuildStagePanel`:
milestone-grouped task checkboxes, a derived progress bar, an "up next" line,
a plain external-build-link text field (`Venture.buildUrl`, no integration),
and the spec-generation trigger. `building -> launched` now refuses silently
skipping unchecked tasks -- it 409s with `reason: "tasks_incomplete"` unless
the client explicitly confirms and resends with `skipRemaining: true`.

**Decisions:**
- **One milestone, one task -- no invented sub-tasks.** The milestone
  objects already carry a name and an outcome; the temptation was to prompt a
  model to break each into finer steps, which would have paid for
  reformatting data already on disk and introduced nondeterminism into a
  step that should be a pure function.
- **`BuildSpecSchema` has no `stack` field, even though the agent brief needs
  a stack recommendation.** The phase spec's schema is authoritative and
  doesn't include one. Threaded the `mvp_scope` artifact's `stack` through as
  optional export context instead of widening the artifact's own schema for
  one rendering concern.
- **Launch gating lives inline in the advance route, not a workflow engine.**
  One conditional (check incomplete tasks, 409 unless `skipRemaining`) is the
  smallest thing that keeps a half-built venture from being silently marked
  launched -- extracting a generic gate would be solving a problem this
  project doesn't have yet.

**Mistake caught mid-session:** the phase file explicitly requires testing
the agent-brief format in a real coding-agent session before writing the
ship post, not just designing it and trusting the schema. Rendered a real
`generate-build-spec` fixture through `buildSpecToAgentBrief` and read it
cold, the way a fresh agent would. It named "auto-organizes" as the
differentiating feature with no stated mechanism, and defined a `User`
entity with no sign-in screen anywhere in `screens` -- a real coding agent
would have had to invent both. Fixed by adding two explicit requirements to
the `generate-build-spec` prompt (name the mechanism behind any "automatic"
claim; a user-shaped entity requires a sign-in screen) and updating the demo
fixture to match, then re-rendered to confirm the gap closed.

**Next step:** Phase 08 — Launch Stage. Deploy the generated landing page for
real.

**Quality Score: 91/100**
- All acceptance criteria met: the zero-AI-calls assertion is a real mock-based
  guard rather than an inference from reading the code, all three export
  formats are tested against the fixture, and the agent brief was genuinely
  round-tripped (not just designed) before the ship post was written, catching
  a real content gap.
- Docked for: the browser smoke test's first pass used a Playwright `.check()`
  assertion that raced React's `router.refresh()` DOM swap and failed on a
  false positive (fixed by switching to a plain `.click()` + re-query) -- a
  reminder that the app was fine, the test's assumption about DOM node
  identity across a server-component refresh was not.

---

## 2026-07-28 — Plan Phase 06: Planning Stage

**What we did:**
Added the second stage of real AI work: `plan-venture` (positioning, ICP with
concrete named channels, differentiation, first-10-users plan, success
metric, and a required `killCriteria`) and `scope-mvp` (core loop, must-have
features capped at 5, `explicitlyNot` cuts floored at 3, 3-6 milestones each
capped at 14 days, stack recommendation, riskiest assumption). Both chained
in `planAndAdvance()`, advancing `validated -> planned` only after both
succeed -- if the second call fails, the first artifact (the plan) stays
saved and the venture stays at `validated`, so partial progress is never
discarded. Added `regenerateArtifact()` and a "Not quite -- tell Nucleus why"
UI control that re-runs a task with the founder's feedback appended to the
prompt, versioning artifacts by `createdAt` rather than overwriting. The
workspace page now groups artifacts by kind in a fixed display order
(preventing a just-regenerated `mvp_scope` from jumping above its own
prerequisite `validation`), showing the latest of each kind with older
versions collapsed.

**Decisions:**
- **`explicitlyNot` given a `.min(3)` floor, not just documented as a
  requirement.** A cap alone (`mustHave.max(5)`) forces triage; a floor on a
  different field forces the model to actually produce cuts instead of
  leaving the array empty or writing one throwaway line. Both directions of
  the same lesson: a schema constraint is a stopping condition prose can't
  give you.
- **Artifacts render in a fixed `KIND_ORDER`, not recency order.** The
  natural approach (sort all artifacts by `createdAt` and render) would put a
  freshly-regenerated `mvp_scope` above the `validation` artifact it depends
  on, which reads as backwards. Grouped by kind, ordered by the domain's own
  logical sequence instead.
- **`VentureActions`'s "Advance to Planning" needed a genuinely different
  request shape than "Kill"/"Archive".** Those send `{ to: "killed" }` (a
  plain transition, no AI task). Sending `{ to: "planned" }` the same way
  would have skipped generating the plan entirely -- planning requires the
  AI-driven path (empty body, server infers the task from current stage).
  Two distinct functions in the component, not one generalized one, because
  they're not actually the same operation.

**Mistake caught mid-session:** browser-verifying dark mode on the venture
workspace page (not just the dashboard, where it had been checked back in
Phase 04) surfaced a real bug -- the "dark" class on `<html>` was only ever
applied by `ThemeToggle`'s own mount effect, and neither the workspace page
nor the settings page render `DashboardHeader` (where `ThemeToggle` lives).
Dark mode silently reset to light on every page except the dashboard. Fixed
by moving theme application into a blocking inline script in the root
layout's `<head>`, which also incidentally closes the flash-of-wrong-theme
gap noted as a known limitation back in Phase 04. Verified with a genuinely
fresh hard navigation (`page.goto`, not `page.goBack()`) so client-side
routing couldn't mask the bug the way it apparently did during the first,
misleading test run.

**Next step:** Phase 07 — Build Stage. Milestones become checkable tasks
(zero AI calls -- the plan already has the content), and a
`generate-build-spec` task produces a handoff document formatted for a
coding agent.

**Quality Score: 92/100**
- All acceptance criteria met: both fixtures validate, the 7-mustHave-entries
  rejection is directly tested, the blocked-second-call partial-progress case
  is tested and browser-adjacent verified, regenerate-with-feedback confirmed
  to retain both versions and to actually pass the feedback text into the
  prompt (not just assumed from the code).
- Docked for the dark-mode bug existing in the first place -- it was a gap
  from Phase 04's incomplete verification (dashboard-only), not something
  introduced this phase, but it shipped for two phases before this session's
  more thorough check caught it. Worth verifying every page a feature claims
  to affect, not just the one it was built on.

---

## 2026-07-28 — Plan Phase 05: Budget Console

**What we did:**
Built the real Settings page: BYOK OpenRouter key entry (tested via a real
minimum-cost call through `runTask()` before saving, never as a special
path), editable budget caps with `daily ≤ weekly ≤ monthly` validation, a
spend breakdown (by task, by venture, a 30-day sparkline), a "Your data"
panel printing the literal on-disk path, and a danger zone (clear cache;
delete-all gated behind typing `DELETE`). Restructured `provider.ts` from a
static module-load-time singleton (`hasAiKey() ? openrouter : mock`, decided
once, env-only) into `resolveProvider()`, resolved fresh on every gateway
call, checking Settings first and falling back to the env var -- the
architectural change that makes "add a key, it works on the very next
request, no restart" actually true. Added a `demo: boolean` flag threaded
from the gateway through `validateAndAdvance` to stored artifacts and the
New Idea modal, and a `downgraded: boolean` flag for the "used a cheaper
model to stay in budget" inline note. Added the three degradation states:
an amber "approaching 80%" header pill, a quiet downgraded note, and the
existing budget-blocked failure screen (already correct from Phase 03).
Central redaction (`redactKey`, `redactSecrets`) so a key can only ever leak
from one place.

**Decisions:**
- **Cache-key correctness carried over from Phase 02 still holds**: since the
  demo/downgraded flags are computed in the gateway from the *resolved* tier
  and provider, not the task's preferred ones, there was no need to touch the
  cache-key logic at all this phase -- it was already keyed correctly.
- **`isApproaching()` extracted into `src/lib/budgetStatus.ts`**, not left
  inline in `DashboardHeader.tsx`. Importing a `.tsx` file (even for one pure
  function) into a plain `.test.ts` file broke Vitest, which has no JSX
  transform configured -- the fix was the same pattern already used for
  `stages.ts`/`format.ts`: pure logic lives in a plain module, components
  import it, never the other way around for testability.
- **The Test-key button goes through `runTask()` like every other call, not
  a bypass.** It constructs a `Provider` for the *candidate* (unsaved) key via
  `makeOpenRouterProvider()` and passes it as the gateway's provider
  override -- reusing the exact extensibility point the tests already use,
  rather than adding a second code path for "test mode."
- **No key encryption at rest.** Considered and rejected: the decryption key
  would live on the same disk as the ciphertext, which doesn't raise the bar
  against the threat that matters (filesystem access) and would let
  `encrypted: true` misrepresent the actual security boundary to anyone who
  doesn't check. Plain storage, documented honestly in the UI, is the
  trustworthy choice.

**Verification note:** the redaction and live-cap-effect claims were verified
with real commands, not just read from the code: `curl` to set a fake key and
confirm `GET /api/settings` never echoes it back; `grep -ri "sk-or-"
.nucleus/*.json` confirming the key exists in exactly one file and nowhere in
the dev server log; setting a near-zero daily cap and confirming the very
next `advance` call blocks, then raising the cap and confirming the very next
call (same running server, no restart) succeeds.

**Next step:** Phase 06 — Planning Stage. `plan-venture` and `scope-mvp`
tasks, with `killCriteria` and `explicitlyNot` as required fields for the
same reason `whyNot` was required in Phase 03.

**Quality Score: 94/100**
- Every acceptance criterion in the phase file verified directly against
  running output, not inferred: the redaction grep, the block-then-immediate-
  recovery cap test, the demo flag confirmed present on the actual artifact
  written to disk, the typed-DELETE gate confirmed both to block on the wrong
  input and unlock on the exact one.
- Docked slightly for the sparkline being a genuinely minimal implementation
  (single SVG path, native `<title>` tooltips, no crosshair) -- an honest
  scope call given this is an internal ops widget, not a marketing chart, but
  flagged with a `ponytail:` comment naming the upgrade path rather than
  silently under-building.

---

## 2026-07-28 — Plan Phase 04: Venture Workspace

**What we did:**
Deleted `mock-data.ts` entirely and every component that depended on it
(`ActiveProjectsCard`, `SavedIdeasCard`) -- the dashboard now renders only
real data. Built the venture workspace (`/ventures/[id]`): stage timeline
(with `killed`/`archived` as distinct muted terminal branches, not error
states), artifact renderers dispatched by `kind` with a safe fallback for
unknown shapes, Kill/Archive actions, and a real per-venture spend line
(`aiCalls.sumByVenture`, a new repository function). Extracted the verdict
and competitor rendering out of `NewIdeaFlow`'s modal into
`src/components/venture/artifacts/` so the modal and the workspace page
render identically instead of drifting. Added `/api/budget` and
`/api/artifacts`. Rewired `idea-export.ts` against the real `Venture`/
`Artifact` shape with a genuine artifacts array, not the empty placeholder
Phase 01 had deferred. Added a dark mode toggle (`ThemeToggle`, a small
dedicated client component so `DashboardHeader` itself stays a server
component) and generalized `Badge` from a `ProjectStatus`-coupled component to
a `StageTone`-based one so it survived the mock-data deletion.

**Decisions:**
- **Fixed the `Badge`/`ProjectStatus` coupling before deleting `mock-data.ts`,
  not after.** Sequencing mattered here: generalizing `Badge` to accept a
  `tone` prop (backed by a new `stageTone()` helper in `stages.ts`) first
  meant the app was never in a broken intermediate state where mock-data.ts
  was gone but something still imported `ProjectStatus` from it.
- **"Save for later" now navigates to the real workspace page** instead of
  just closing the modal -- the venture already exists and is already
  validated by the time that button is clickable, so showing the user what
  they just created is more honest than hiding it behind a toast.
- **Quick Actions reduced from three decorative buttons to two wired ones.**
  The original "New Idea" and "Check Growth" quick-action buttons had no
  `onClick` at all -- they never did anything. Rather than carry that forward
  into a real-data dashboard, replaced them with two actions that actually
  work: a real export trigger and a scroll-anchor link to the budget card.
- **Competitors render as a plain expanded block now, not a collapsible
  `<details>`.** Lost a small interaction in exchange for the workspace page
  and the modal sharing one component with zero drift. Worth revisiting if
  the panel gets visually noisy later.

**Mistake caught mid-session:** none in the shipped code, but one wasted
detour -- inspecting a full-page screenshot of the result modal early in this
phase's UI work, the action buttons appeared visually clipped at the bottom
edge. Before treating it as a layout bug, checked the actual computed
`getBoundingClientRect()` values, which showed the buttons fully inside the
viewport with room to spare. It was a `fullPage: true` Playwright screenshot
capture quirk, not a real defect -- caught before spending time "fixing" a
working layout.

**Next step:** Phase 05 — Budget Console. BYOK settings page, editable caps,
spend breakdown, and the three degradation UX states (approaching/downgraded/
blocked) with real designs instead of the current bare failure screen.

**Quality Score: 93/100**
- All acceptance criteria met: the grep-for-fake-data check returns nothing,
  every screen browser-verified in both themes at both 1280px and 375px, the
  full loop (empty state -> create -> validate -> workspace -> kill ->
  dashboard reflects it) verified in one continuous real-browser session with
  zero console errors, export verified to actually contain artifact content
  by reading the downloaded file back, not just checking that a download fired.
- Docked slightly for the Quick Actions rework and the competitors-collapse
  regression -- both reasonable calls, but both went a little beyond the
  phase file's literal step list into adjacent honesty-driven cleanup. Worth
  naming rather than quietly absorbing into "Phase 04 as planned."

---

## 2026-07-28 — Plan Phase 03: Real Validation

**What we did:**
Replaced `generateMockAnalysis` with real AI validation. Two new tasks:
`validate-idea` (tier mid, produces a `Verdict` with a required `score`,
`recommendation`, `whyNot`, risks, market size, audience pain level, moat,
and cheapest test) and `analyze-competitors` (tier frontier, 3-6 named
competitors, gated to only run for ideas scoring >= 40). Extracted the
orchestration -- run validate-idea, conditionally run analyze-competitors,
advance the venture -- into `src/server/ventures/validateAndAdvance.ts`
rather than inlining it in the API route, specifically so it could be
unit-tested with a stub provider the same way the gateway already is.
Rewrote `NewIdeaFlow.tsx` end to end: real fetch calls instead of a fake
timer, a genuine result screen with `whyNot` above the fold, and three
distinct failure screens (`budget_exceeded`, `invalid_output`,
`provider_error`) each with human-readable copy and no leaked technical
detail. Deleted `generateMockAnalysis`/`IdeaAnalysis` from `mock-data.ts`.

**Decisions:**
- **Moved `Verdict`/`Competitors` zod schemas into `src/lib/domain.ts`**
  instead of leaving them defined in `src/server/ai/tasks/*.ts`. Caught this
  before writing any client code: the result screen (a `"use client"`
  component) needs these types, and importing them from `@/server/...` --
  even as a type-only import -- would have violated the client/server
  boundary rule in spirit, if not in the exact letter the regex checks. One
  clean move avoided a workaround entirely.
- **Extracted `validateAndAdvance()` out of the API route.** Testing the
  "competitor analysis skipped below score 40" claim properly needs a stub
  provider and an isolated temp data dir -- fighting `NextRequest`/
  `NextResponse` to get that inside a route handler test would have been
  worse than just factoring the orchestration into a plain, directly
  testable function. The route is now a thin wrapper.
- **Kill produces a distinct, better event summary** ("Killed \"X\" -- saved
  time before writing a line of code") rather than the generic "moved to
  killed" -- this is the single most shareable outcome the product has, and
  the copy should say so.

**Verification note:** browser-verified all three failure screens, not just
the happy path, per the phase's explicit requirement. Budget-exceeded was
forced honestly (seeding a real near-zero cap in `.nucleus/settings.json`).
invalid_output and provider_error were forced with a temporary conditional in
the mock provider triggered by a marker string in the prompt, screenshotted,
then the file was reverted and confirmed to produce an exact-empty `git diff`
before moving on -- no test-only code shipped.

**Mistake caught mid-session:** a `fullPage: true` Playwright screenshot made
the result modal's action buttons look clipped at the bottom edge. Before
"fixing" a UI that might not have been broken, checked the actual DOM via
`getBoundingClientRect()` -- the buttons were fully within the viewport
(bottom at y=872 of a 1000px-tall viewport). The screenshot capture mode was
misleading, not the layout. Worth remembering: verify with the DOM, not just
by eyeballing a screenshot, before spending time on a fix that isn't needed.

**Next step:** Phase 04 — Venture Workspace. Delete `mock-data.ts`'s
remaining fake projects/growth/activity, build `/ventures/[id]`, and make
every number on the dashboard real.

**Quality Score: 92/100**
- All acceptance criteria met, including the ones easy to skip: all three
  failure screens actually forced and screenshotted, not just the two easy
  ones; the score-band reconciliation tested at exact boundary values (39,
  40, 69, 70); competitor-analysis gating verified via a direct call-count
  assertion, not inferred from the artifact list.
- Docked slightly: the mock provider's temporary test-forcing hack, while
  fully reverted and diff-verified, is a slightly fragile manual verification
  technique (string matching in the prompt) that would be worth formalizing
  into a small `--force-failure` test harness if this kind of verification
  becomes routine across future phases.

---

## 2026-07-28 — Plan Phase 02: AI Gateway

**What we did:**
Built the AI chokepoint every future model call routes through: a model
pricing table with three tiers (`cheap`/`mid`/`frontier`) and cost estimation
biased to round up; a budget guard (`preflight()`) that derives spend by
summing the `aiCalls` ledger per window (daily/weekly/monthly, local time,
handles midnight and Sunday->Monday rollovers correctly) and returns
`ok | downgrade | block` *before* any request goes out; a provider
abstraction (`openrouter` real / `mock` deterministic, selected by whether an
API key is configured); a content-hash cache keyed on the resolved model tier;
a task registry (one placeholder task, `echo-check`, used only by tests); and
`runTask()` itself, which wires all of that together with one repair retry on
schema-invalid output. Added `/api/health` as a system self-check endpoint.

**Decisions:**
- **`prompt` declared as a method (`prompt(input: I): string`), not a
  function-typed property.** A heterogeneous `TASKS` registry holding
  `TaskDef<SpecificInput, SpecificOutput>` entries under one shared `TaskDef`
  type hit a TypeScript contravariance error on the property form. Method
  shorthand is checked bivariantly, which is the correct call for a registry
  like this — avoided reaching for an `any` escape hatch (which ESLint then
  also rejected) in favor of a type-correct fix.
- **Cache key uses the *resolved* tier's model, not the task's preferred
  tier.** If budget forces a downgrade, that answer is only ever cached
  under the cheaper model's key — otherwise a later request, once budget
  recovers, could silently replay a downgraded (lower-quality) cached answer
  under what looks like the preferred-tier key.
- **`echo-check` set to tier `"mid"` with `minTier: "cheap"`**, not `"cheap"`
  outright, specifically so the gateway's downgrade path has somewhere to go
  in tests. The phase spec calls for exactly one task this phase; this way
  one task still exercises the full tier-resolution state machine.
- **Every gateway test's cap values were computed from the actual prompt
  string and pricing table**, not guessed — the first draft of the
  downgrade/minTier tests used round-number caps that turned out not to
  actually force the branch they were meant to test. Caught immediately
  because the assertions failed against real behavior instead of quietly
  passing on a coincidence.

**Mistake caught mid-session:** `next build` statically optimized
`GET /api/health` — it has no dynamic Request API usage (no searchParams,
cookies, headers), so Next.js pre-rendered it once at build time instead of
per request. For a health endpoint reporting live spend and venture counts,
that's a real bug: production would have served a permanently stale
snapshot from build time. Caught by reading the build output route table
(`○` static vs `ƒ` dynamic) rather than assuming. Fixed with
`export const dynamic = "force-dynamic"`.

**Next step:** Phase 03 — Real Validation. The `validate-idea` and
`analyze-competitors` tasks, the verdict schema with a required `whyNot`
field, and wiring the New Idea flow to real (or mock) AI instead of
`generateMockAnalysis`.

**Quality Score: 93/100**
- All acceptance criteria met, TDD followed strictly on models/budget/gateway
  per the phase's explicit requirement, and the single most load-bearing
  assertion in the plan so far (zero provider calls on a blocked request) is
  verified directly, not inferred.
- Docked slightly for the two rounds of test-value corrections on the
  downgrade tests — not a design flaw, but worth naming that hand-computed
  cost thresholds in test fixtures are worth double-checking programmatically
  before trusting them, every time.

---

## 2026-07-28 — Plan Phase 01: Domain & Storage

**What we did:**
Replaced the `Idea`/localStorage model with a real `Venture` domain: zod
schemas for `Venture`, `Artifact`, `NucleusEvent`, `AiCall` in
`src/lib/domain.ts`; a stage machine (`src/lib/stages.ts`) with an explicit
transition table (`killed` only reachable from `captured`/`validated`,
`archived` terminal); an atomic JSON file store
(`src/server/db/store.ts` — temp-file-then-rename writes, corrupt-file
recovery with backup, last-5-backup pruning); five repositories
(ventures, artifacts, events, aiCalls, settings); an event-recording spine
(`src/server/events.ts`); and `/api/ventures`, `/api/ventures/[id]`,
`/api/events` route handlers. The dashboard now reads/writes through that
API instead of `localStorage`, with a one-time migration of any
`nucleus:saved-ideas` data into real ventures on first load.

**Decisions:**
- **Optional `{ baseDir }` on every store/repository function.** Not in the
  original phase spec verbatim, but needed to unit-test filesystem code
  against a temp directory instead of the real `.nucleus/` — avoids test
  pollution and lets tests run in parallel. Production code just omits it
  and falls back to `config.NUCLEUS_DATA_DIR`.
- **`idea-export.ts` kept but decoupled, not deleted.** Its `SavedIdea` type
  came from the file being deleted this phase. Rather than either deleting
  the module (losing real Day-2 work) or prematurely wiring it to `Venture`
  (Phase 04's explicit job), gave it a local copy of the old type so it still
  compiles while sitting unused. Zero behavior change, smallest possible diff.
- **Export buttons removed from `SavedIdeasCard` for this phase.** Their only
  data source (`SavedIdea`) no longer exists after the migration; re-adding
  them against `Venture` is explicitly Phase 04 scope, not squeezed in here.

**Mistake caught mid-session:** the first version of the Playwright
verification script used `page.addInitScript()` to seed a legacy
`localStorage` idea, then called `page.reload()` later in the same script to
check persistence. `addInitScript` re-fires on every navigation in that page,
including reloads — so the reload re-seeded the legacy key and the migration
ran a second time, creating a duplicate venture and failing the test's
`waitForSelector`. Root cause was in the *test script*, not the app (the
migration itself is correctly idempotent — it clears the key synchronously
before any `await`). Fixed by splitting verification into two isolated pages:
one with the init script for the migration check, a second clean page for the
save/reload/continue flow. Worth remembering as a general Playwright gotcha,
not just a one-off.

**Next step:** Phase 02 — the AI gateway. `runTask()`, the budget preflight
guard, and the mock/OpenRouter provider split. This is the phase the plan
calls the one to protect if time is ever short.

**Quality Score: 91/100**
- All acceptance criteria met: migration verified in a real browser with a
  legacy key seeded, `Saved Ideas (2)` confirmed to survive a real reload
  (file-store persistence, not just React state), illegal stage transitions
  proven to throw via both a unit test and a rejected API call path.
- Docked slightly: the export-button removal is a real (if temporary and
  planned) UX regression for this phase — acceptable per Phase 04's explicit
  scope, but worth naming rather than glossing over.

---

## 2026-07-28 — Plan Phase 00: Ground Truth

**What we did:**
Built the test harness the project had zero of: Vitest, a Zod-validated
`src/server/config.ts` (safe defaults on an empty env, so demo mode needs no
setup), a boundary test that walks `src/` and enforces four architecture
rules by regex (no client component imports server code; only
`server/ai/provider.ts` may ever mention the OpenRouter host; only
`server/db/store.ts` may import `node:fs`; `src/lib/` stays free of Node
builtins), GitHub Actions CI running `npm run verify` + `npm run build` on
every push, and the `verify` script itself (`tsc --noEmit && next lint &&
vitest run`). Also banner-marked `docs/MASTER_PLAN.md` as superseded for
scope by the new `docs/plan/` (written in the prior planning session).

**Decisions:**
- **Boundary rules as a regex-walking test, not ESLint config.** An ESLint
  `no-restricted-imports` rule can't express "only this exact file is
  exempt" as cleanly, and its errors are worse to read. A 70-line test file
  said precisely what was meant and prints the offending path directly.
- **`zod` moved to runtime dependencies, not dev.** It validates LLM output
  and env at request time in later phases — this isn't a build-time-only tool.
- **Config defaults make every env var optional except the ones with
  defaults.** No `OPENROUTER_API_KEY` set is not an error state — it's the
  signal that selects the mock AI provider in Phase 02. The whole demo-mode
  design depends on an empty environment parsing cleanly.

**Verification note:** the phase file explicitly required not just writing
the boundary test but watching it fail. Added a temporary `node:fs` import to
`src/lib/mock-data.ts`, reran `vitest run tests/boundaries.test.ts`, confirmed
two rules failed with the exact filename in the output, then reverted. A test
that has never been seen to fail is unverified in the same way as code that's
never been run — worth doing every time a new boundary rule is added, not
just this once.

**Mistake caught mid-session:** none. `npm run verify` and `npm run build`
both passed clean on first attempt.

**Next step:** Phase 01 — Domain & Storage. Replace `Idea`/localStorage with
a `Venture` domain model and an atomic JSON file store under `.nucleus/`.

**Quality Score: 90/100**
- All acceptance criteria met, including the "don't just write the test, break
  it on purpose" requirement, which is easy to skip and wasn't skipped.
- Docked slightly: no new feature shipped this phase (by design — it's pure
  foundation), so the Peerlist posts lean on process rather than a demoable
  result. That's an honest trade for phase 00, not a flaw to fix.

---

## 2026-07-26 — Phase 1, Day 1: Dashboard Foundation

**What we did:**
Built the dashboard UI foundation (header, new-idea/stats panel, active projects list, recent activity/growth/quick-actions row) using the full Plan → Discuss → Implement → Review → Refine cycle. Zero new dependencies — reused the existing Tailwind theme tokens instead of installing shadcn/ui's CLI.

**Decisions:**
- **Postponed shadcn/ui install.** Theme tokens already existed in `globals.css`, but the CLI/component layer never did. Today's page is fully static, so hand-rolled `Card`/`Badge`/`ProgressBar` primitives cover it with zero new deps. Revisit when the idea-input flow needs a real Dialog (Radix's focus-trap/accessibility behavior earns its keep there, not on static cards).
- **Emoji over icon library.** Mockup only needed 🧠💰🔔👤 — no reason to pull in lucide-react for that.
- **Data flows through props, not direct imports.** Initial Implement pass had dashboard components importing `mock-data.ts` directly. Review flagged this as coupling that would force an edit in every component when real data (Supabase) replaces the mocks. Refine pass moved all mock-data imports up to `page.tsx`, which now passes data down as props — components are pure/presentational.

**Mistake caught mid-session:**
Ran `next build` against the same `.next` directory while `next dev` was still running — corrupted the dev server's webpack module cache (`__webpack_modules__[moduleId] is not a function`, 500 on every route). Not a code bug. Fix: stop the dev server before running a production build, or use separate build outputs. Killing the dev process and deleting `.next` before restarting resolved it.

**Next step:** Day 3 item — design the "New Idea" input flow (this is where shadcn's Dialog/Input actually gets installed and used).

**Quality Score: 88/100**
- Plan/Discuss decisions all traced cleanly into the implementation with no drift.
- Docked for: no visual/screenshot verification of responsiveness (no browser tool available this session, confirmed structurally via Tailwind breakpoints only), and the `next build`/`next dev` cache collision that cost a debugging detour.

---

## 2026-07-26 — Phase 1, Day 1: New Idea Flow (mock)

**Learnings:**
- Data should flow through props from the composition root, not be imported directly by leaf components.
- Don't run `next build` while `next dev` is live against the same `.next` directory — cache corruption.
- shadcn/ui postponement was the correct call for static cards; confirmed again by shipping a custom Tailwind/React modal without it.
- `Modal` should live in its own client file, not get mixed into `ui.tsx` alongside the server-rendered primitives — keeps unrelated Server Components out of the client bundle.
- First client component (`NewIdeaFlow`) increased page JS from 138B to 1.68kB — acceptable cost for real interactivity.

---

## 2026-07-27 — Phase 1, Day 2: Continue/Save/Saved Ideas

**What we did:**
Made Continue and Save functional as UI-only mock flows. Save persists ideas to a `localStorage`-backed store (`src/lib/idea-storage.ts`); Continue shows a bottom toast ("Taking you to project creation...") then closes the modal — no real route was built, as scoped. Added a "Saved Ideas" section to the dashboard. Verified the whole loop (input → analyze → save → reload persistence → continue toast) with a real headless-Chromium smoke test, not just `tsc`/`next build`.

**Decisions:**
- **`page.tsx` became a client component.** Saving needs to trigger a re-render of the Saved Ideas list, and the page had no client boundary yet. Rather than add a wrapper component, the whole page (which is fully static/mock data anyway) got `"use client"` — fewer files, same effect.
- **Callbacks threaded through props (`onSaveIdea`, `onContinue`), not a context/global store.** Only two components sit between the button and the page-level state (`NewIdeaCard` → `NewIdeaFlow`); a Context would be premature for a 2-level prop chain.
- **Toast is a plain `useState` + `setTimeout`, not a library.** One message, one use site — didn't justify a dependency.

**Mistake caught mid-session:** None — `tsc --noEmit` and `next build` both passed clean on the first attempt, and the browser smoke test passed on the first run with zero console errors.

**Verification note:** No `chromium-cli` or project-level Playwright install existed in this environment. Installed `playwright` + Chromium into the scratchpad directory (not the project's `package.json`) purely to drive a real browser for verification, then tore down the dev server afterward. Worth adding a project skill for this later if browser verification becomes routine.

**Next step:** Day 3 — budget tracking / OpenRouter cost monitoring (daily $10 / weekly $30 / monthly $50 limits, warning system).

**Quality Score: 92/100**
- All four Day 2 tasks shipped and verified end-to-end in a real browser, not just type-checked.
- Docked slightly for: no automated test file left behind for `idea-storage.ts` (manual smoke test only), and the toast/Continue UX is deliberately minimal per the "stub only" constraint.
