# Session Learning Log

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
