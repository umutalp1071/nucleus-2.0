# NUCLEUS 2.0 — EXECUTION PLAN

**You are Sonnet 5. This directory is your instruction set. You execute it
without asking the founder for anything.**

---

## Read order (first session only)

1. `00-ANSWER.md` — why the system is shaped this way. Non-negotiable.
2. `ARCHITECTURE.md` — the target system.
3. `CONVENTIONS.md` — how to write code here + the Definition of Done.
4. `PEERLIST-PLAYBOOK.md` — how to write the posts. They are a deliverable, not an afterthought.
5. `PROGRESS.md` — where execution currently stands.

Then open the current `PHASE-NN-*.md` and work.

**Every later session:** read `PROGRESS.md`, then the current phase file, then
`CONVENTIONS.md`. Do not re-read everything.

---

## The operating loop

Run this for every phase. Do not improvise a different one.

```
1.  PROGRESS.md → identify current phase N
2.  Read PHASE-NN completely, including "Out of scope"
3.  Append a "Plan of record" block to PROGRESS.md:
      - the files you will create/modify
      - the risk you consider most likely
    (this is the pre-mortem lesson #7 requires; keep it to 5 lines)
4.  For each step in the phase:
      a. write the failing test first  (CONVENTIONS.md §Testing says when)
      b. implement the minimum that passes
      c. run `npm run verify`
5.  If the phase touched UI → run the `run-dashboard` skill, screenshot,
    LOOK at the screenshot. A passing build is not a working screen.
6.  Write BOTH Peerlist posts to docs/content/drafts/ (see PEERLIST-PLAYBOOK.md)
7.  Update PROGRESS.md (mark phase done, record decisions + dependency ledger)
8.  Update docs/workflow/learning.md using the PROTOCOL.md format
9.  git commit + push  (project rule: push is always approved)
10. Move to phase N+1. Do not skip. Do not merge two phases into one commit.
```

---

## Hard rules

These exist because Nucleus 1.0 died of violating them. They are not style
preferences.

1. **Never exceed the phase scope.** Every phase has an explicit "Out of
   scope" list. A good idea that is out of scope goes in `BACKLOG.md`, not in
   the diff. Scope creep is the #1 predicted failure of this plan.

2. **Never ask the founder for a credential, an account, or a decision the
   plan already made.** If something genuinely blocks you, write a `BLOCKED`
   entry in `PROGRESS.md` with the exact question, then **continue to the next
   unblocked phase**. Do not stall.

3. **Never add an npm dependency** without an entry in the Dependency Ledger
   in `PROGRESS.md` justifying why stdlib / an existing dep / ten lines
   wouldn't do. The current dependency count is a feature.

4. **Never claim done without evidence.** "Tests pass" means you ran them and
   read the output in this session. `verification-before-completion` applies
   to every phase.

5. **Never break the AI chokepoint.** All model traffic goes through
   `runTask()`. A test enforces this; do not weaken the test.

6. **Never require a network call to run tests.** Every external dependency
   has a deterministic fake. If a test needs the internet, it is written wrong.

7. **A phase without its two Peerlist posts is not complete.** Marketing runs
   in parallel with development or the project fails the way 1.0 did.

---

## Phase map

| # | Phase | Ships | Depends on |
|---|---|---|---|
| 00 | Ground Truth | test harness, CI, config, verify gate | — |
| 01 | Domain & Storage | Venture model, file store, repositories | 00 |
| 02 | **The AI Gateway** | runTask, budget guard, schema validation | 01 |
| 03 | Real Validation | AI verdict + kill recommendation | 02 |
| 04 | Venture Workspace | detail page, stage timeline, dashboard rework | 03 |
| 05 | Budget Console | BYOK settings, live spend, degradation UX | 02 |
| 06 | Planning Stage | positioning, ICP, MVP scope, milestones | 04 |
| 07 | Build Stage | task board, build-spec handoff export | 06 |
| 08 | Launch Stage | landing page generation + real deploy | 07 |
| 09 | Growth Stage | content calendar, metrics | 08 |
| 10 | Build-in-Public Engine | events → post drafts, in-app | 09 |
| 11 | Immune System | error capture, health, self-audit | 10 |
| 12 | Ship It | a11y, onboarding, docs, public launch | 11 |

Phases 02 and 03 are the ones that make Nucleus real. Everything before is
foundation; everything after is surface. If time is ever short, protect 02.

---

## Session-end protocol

`docs/workflow/PROTOCOL.md` defines a session-end ritual (learning.md,
TOMORROW_PLAN.md, MASTER_PLAN.md, content drafts, mistake DB). That protocol
still applies, with two amendments:

- `PROGRESS.md` replaces `TOMORROW_PLAN.md` as the state-of-execution file.
  Update `TOMORROW_PLAN.md` only at the end of a working day, not per phase.
- The content drafts are now produced **per phase**, not per session, and must
  follow `PEERLIST-PLAYBOOK.md` rather than the older bare templates.

Quality Score self-assessment stays. Be honest; a 70 with a real reason is
worth more than a 95 you can't defend.
