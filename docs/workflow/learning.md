# Session Learning Log

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
