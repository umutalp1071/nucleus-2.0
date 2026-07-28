# START HERE

## For Claude — every session

Read these three, in order, then work:

1. `docs/plan/PROGRESS.md` — which phase is current, what's blocked, what was decided
2. `docs/plan/PHASE-NN-*.md` — the current phase, including its "Out of scope" list
3. `docs/plan/CONVENTIONS.md` — the Definition of Done

Then run `/nucleus-phase`.

**First session only**, also read `docs/plan/00-ANSWER.md` (why the system is
shaped this way) and `docs/plan/ARCHITECTURE.md` (the target system).

Do not use `docs/CONTEXT.md`, `docs/MASTER_PLAN.md`, or `docs/TOMORROW_PLAN.md`
for scope. They are historical record. `docs/plan/` supersedes them.
`docs/mistakes/nucleus-1.0-lessons.md` is still worth reading once — the whole
plan is shaped around avoiding those sixteen failures.

---

## For the founder

**What you own:** direction, and the approve/reject button on the Peerlist
drafts in `docs/content/drafts/`.

**What you don't have to do:** decide implementation details, create accounts,
or supply credentials. The plan runs without any of that — Nucleus works in
demo mode with zero configuration and switches to live AI the moment an
OpenRouter key is added in Settings.

**Where things stand:** `docs/plan/PROGRESS.md`.

**What's being built:** a single-operator, self-hosted venture copilot. It
validates ideas (and will tell you to kill them), plans them, scopes the MVP,
generates and deploys a landing page, and writes the growth content — under a
$50/month AI budget the system cannot structurally exceed.

It does not write your app's source code. That was a deliberate call; the
reasoning is in `docs/plan/00-ANSWER.md` §2.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run verify   # tsc + lint + tests — run before every commit
```

Your data lives in `.nucleus/` as plain JSON. It's yours, it's gitignored, and
you can read it, back it up, or delete it.

---

## The 5–5–10–5–5 rhythm

Still the working cadence within a phase: Plan 5 · Decide 5 · Build 10 ·
Review 5 · Refine 5. The phase files replace the per-day objective that used
to live here.
