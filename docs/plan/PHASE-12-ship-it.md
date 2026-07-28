# PHASE 12 — SHIP IT

**Goal:** a stranger clones the repo and has a working AI venture studio in
under five minutes.

**Why now:** everything works for the person who built it. This phase makes it
work for someone who has never seen it — which is the whole point of the
vision statement.

---

## Scope

**In:** onboarding, accessibility, performance, README/docs, one-command
setup, public launch assets.

**Out of scope:** multi-user auth. Hosted SaaS. Billing. Plugins. All of it is
post-launch and belongs in `BACKLOG.md`. Do not start Phase 4 of the old
MASTER_PLAN here.

---

## Steps

### 1. First-run experience

On first launch (no `.nucleus/`), a three-step walkthrough:

1. **What Nucleus does** — one screen, honest: it validates, plans, launches,
   and grows ventures. It does **not** write your app's code. Saying this on
   screen one is a feature; a user who discovers it on day three feels misled.
2. **Add your key (or skip)** — OpenRouter link, cost expectation ("about
   $0.15 per full venture analysis"), Skip → demo mode
3. **Your first idea** — the actual New Idea flow, pre-filled with an example
   they can edit

Skippable. Never shown again. Under 60 seconds.

### 2. Accessibility pass

Not optional, not deferrable:

- keyboard navigation through every flow, visible focus states everywhere
- modals: focus trap, Escape closes, focus restored on close. This is where
  the Radix dependency was postponed back on Day 1 — re-evaluate honestly. If
  a correct focus trap is more than ~40 lines, take the dependency.
- semantic landmarks, one `h1` per page, labelled form controls
- WCAG AA contrast in **both** themes — check, don't assume
- `aria-live` on the analyzing/loading states so a screen reader user knows
  something is happening
- `prefers-reduced-motion` respected on the spinner

Verify with keyboard-only navigation in the browser. Actually do it.

### 3. Performance

- Lighthouse ≥ 90 on performance and accessibility for dashboard and workspace
- no layout shift on load
- long AI operations show progress within 200ms of the click
- the venture list stays usable at 100 ventures (generate them and check)

### 4. Documentation

**`README.md`** — a complete rewrite. Currently it is Next.js boilerplate.

- what Nucleus is, in two sentences, including what it doesn't do
- a screenshot or GIF of the full flow
- quickstart: `git clone && npm install && npm run dev`
- BYOK setup, and the honest cost table per venture stage
- where your data lives and how to take it
- the architecture in five lines with a link to `ARCHITECTURE.md`

**`docs/USER-GUIDE.md`** — the venture lifecycle explained for a non-technical
reader. No model names, no token counts, no architecture. This document is the
test of whether "freedom from needing to know" was actually achieved.

**`CONTRIBUTING.md`** — how to add a new AI task, in ten lines. If it takes
more than ten, the architecture failed and that is worth knowing.

### 5. One-command setup

`npm run dev` on a fresh clone must work with zero configuration: create
`.nucleus/`, seed default settings, start in demo mode, open onboarding.

Test this on a genuinely clean clone in a temp directory. Not "it should
work" — clone it and run it.

### 6. Launch assets

- 60–90 second demo recording: idea → kill verdict → second idea → plan →
  landing page → live URL, with the total cost on screen at the end
- five screenshots for the Peerlist post
- a launch post following the playbook
- update `docs/CONTEXT.md` §7 to reflect what actually got built

### 7. Final honesty pass

Read every user-facing string. Remove anything that overpromises. If the
dashboard says "AI Venture Studio" and it can't write code, the docs say so
plainly and early.

Reputation is the asset being built here. Overclaiming spends it.

---

## Acceptance

- Fresh clone in a temp dir → `npm install && npm run dev` → onboarding →
  full venture flow in demo mode, **zero configuration, zero accounts**.
  Do this literally.
- Lighthouse ≥ 90 performance and accessibility on both main pages
- Full keyboard-only pass of the entire flow
- Both themes, 375px and 1440px, screenshots read
- `npm run verify` and `npm run build` pass
- A person who has never seen the project can follow `USER-GUIDE.md` — if
  nobody is available to test that, read it aloud as if you'd never seen it

---

## Risks

| Risk | Mitigation |
|---|---|
| "Works on my machine" | Test on a genuinely fresh clone in a temp directory |
| Overclaiming in launch copy | The honesty pass; state the codegen limitation on onboarding screen 1 |
| Accessibility deferred as polish | It is in the acceptance criteria; the phase is not done without it |
| Launch to silence | Twelve phases of build-in-public posts already exist. That audience is the launch |

---

## Peerlist posts

**A — SHIP:** *"Nucleus 2.0 is live. Clone it, run it, no account needed."*
The launch post. Demo video. The numbers: N phases, X lines, 6 runtime
dependencies, $0 to run in demo mode, ~$0.15 per fully analysed venture, zero
required accounts. State plainly what it does and what it doesn't. Link the
repo.

**B — LESSON:** *"Twelve phases in, here's what I'd do differently."*
The retrospective, and the post that earns the most trust in the whole series.
Be genuinely honest — name the phase that took twice as long as planned, the
design that got rewritten, the abstraction that turned out to be premature.
Then the one thing that unambiguously worked: putting every AI call behind one
function in Phase 02, before there was a second call site. Every cross-cutting
concern since — budget, caching, routing, validation, incident capture — was a
change to one file instead of a change to twelve. Close the arc that started
with "I wrote 1,318 lines before I wrote a single test." Ask: what's the one
architectural decision you'd make earlier next time?
