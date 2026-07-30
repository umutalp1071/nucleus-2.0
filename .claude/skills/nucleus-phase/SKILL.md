---
name: nucleus-phase
description: "Execute one phase of the Nucleus 2.0 implementation plan end to end — read the phase spec, implement with TDD, verify in a real browser, write the Peerlist post(s), update state, commit and push. Use whenever asked to work on Nucleus, continue development, execute a phase, or when the user types /nucleus-phase."
---

# Execute a Nucleus 2.0 phase

The plan lives in `docs/plan/`. It is authoritative. You execute it; you do
not redesign it.

`/nucleus-phase` with no argument continues the current phase from
`docs/plan/PROGRESS.md`. `/nucleus-phase 4` forces phase 4.

## Before anything else

Read, in this order:

1. `docs/plan/PROGRESS.md` — where things stand, what's blocked, what was decided
2. `docs/plan/PHASE-NN-*.md` — the phase, **including its "Out of scope" list**
3. `docs/plan/CONVENTIONS.md` — Definition of Done

First session only, also read `docs/plan/00-ANSWER.md` and
`docs/plan/ARCHITECTURE.md`. After that, don't re-read them unless a decision
seems to contradict them — in which case the documents win.

## The loop

```
1. Append a "Plan of record" block to PROGRESS.md (5 lines: files + likeliest risk)
2. For each step in the phase:
     write the failing test  →  implement the minimum  →  npm run verify
3. UI touched? Run the run-dashboard skill. LOOK at the screenshots.
4. Write the Peerlist post(s) (docs/plan/PEERLIST-PLAYBOOK.md, angles are
   pre-assigned at the bottom of the phase file as a menu, not a mandate).
   Default to **one** post — whichever angle is genuinely stronger for this
   phase; write both only when the phase clearly earns both (a real
   demoable capability *and* a real decision worth arguing). No
   `**Publish date:**` line and no "today"/"this week" language — content is
   a queue the founder publishes at their own pace, not a diary. Every post
   still gets a `## Visual` section at the end naming the exact screenshot,
   recording, or AI-image prompt to accompany it.
5. Update PROGRESS.md — status, decisions, dependency ledger
6. Append to docs/workflow/learning.md in PROTOCOL.md format, honest Quality Score
7. git commit + push (push is pre-approved by project rule)
8. Report: what shipped, what you verified, what's next
```

## Non-negotiable

- **Scope.** Nothing from the phase's "Out of scope" list enters the diff.
  Good ideas go to `docs/plan/BACKLOG.md`. Scope creep is the predicted
  failure mode of this entire plan.
- **Evidence.** "Tests pass" means you ran them and read the output this
  session. A green build is not visual verification — read the screenshot.
- **The chokepoint.** All AI traffic goes through `runTask()`. A test enforces
  it. Do not weaken that test.
- **No new dependency** without a Dependency Ledger row in `PROGRESS.md`
  naming what you rejected.
- **A post, or the phase isn't done.** Marketing runs in parallel or this
  project fails the way 1.0 did. Default to one strong post; two only when
  earned. A post without a `## Visual` section is not done — see
  PEERLIST-PLAYBOOK.md.
- **Never stall on the founder.** Blocked means: write a `BLOCKED` entry with
  the exact question, then start the next unblocked phase.
- **No network in tests.** Every external dependency has a deterministic fake.

## Gotchas already paid for

- Never run `next build` while `next dev` is live against the same `.next`
  directory — it corrupts the webpack module cache. Stop dev first.
- Route handlers touching the store need `export const runtime = "nodejs"`.
- `playwright` never goes in `package.json` — scratchpad only, per the
  `run-dashboard` skill.
- Use Playwright's `fill`/`type` on React inputs, never `el.value =` via eval.

## Finishing a phase

Report back in this shape, briefly:

```
Phase NN — [name] ✅
Shipped:   [3 bullets]
Verified:  [the commands you ran + what the screenshots showed]
Decisions: [anything non-obvious, already in PROGRESS.md]
Posts:     [the draft filename(s) written this phase]
Next:      Phase NN+1 — [name]
```

Then stop. One phase per invocation unless told otherwise.
