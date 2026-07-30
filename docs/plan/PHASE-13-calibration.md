# PHASE 13 — CALIBRATION

> **New phase, inserted by `docs/reviews/2026-07-30-stack-position.md` §5.5
> and §8, adopted.** Deliberately placed after Phase 12 (ship), not before —
> the review's own counter-argument governs this one: a calibration report is
> a credibility asset, and credibility assets are worthless before anyone is
> looking. Everything in this phase was explicitly deferred at Phase 08.5
> time; nothing here blocks shipping.

**Goal:** an evaluation harness that makes "did that prompt change make
validation better or worse" an answerable, non-vibes question — and the
strongest marketing artifact the project can produce.

**Why now:** the product's central claim is *the willingness and ability to
say kill*. There is currently no way to verify that claim beyond reading the
prose and nodding. Every edit anyone has made to `validate-idea.ts` so far has
been unverifiable. By this phase there are real users and real resolved
predictions (Phases 09–11), which is what makes a calibration report
meaningful rather than a harness running against nothing.

---

## Scope

**In:** a historical-idea eval set, calibration/kill-precision/stability
scoring, a manual eval workflow, a public calibration report.

**Out of scope:** CI integration (run manually before merging a prompt
change; no PR gate). Fine-tuning on collected decisions (needs volume this
project will not have for years — see `BACKLOG.md`). Policy-as-data (separate,
lower-priority BACKLOG item, not required for this phase).

---

## Steps

### 1. The eval set — `tests/eval/ideas.json`

20–30 historical startup ideas with known outcomes, deliberately including:
- famous false negatives investors passed on (Airbnb, Dropbox, Airbnb-style
  "nobody will [X]" cases) — a calibrated system should score these higher
  than a naive skeptic would
- obvious duds — a calibrated system should score these low and recommend
  `kill`
- ambiguous middle cases — where reasonable people disagree, and the
  interesting output is *why*, not just the score

Each entry: `{ idea: string, actualOutcome: "succeeded" | "failed" | "unknown" }`.

### 2. The harness — `tests/eval/run.ts`

Extends `src/server/ai/fixtures/`'s existing determinism rather than
inventing new infrastructure. Runs `validate-idea` against every entry in the
eval set (real provider, `mid` tier — this costs real money, see below) and
computes:

- **calibration** — of ideas scored 70+, what fraction actually succeeded?
- **kill precision** — of ideas scored `kill`, what fraction actually failed?
- **stability** — same idea, three runs, score variance. A verdict that
  swings ±25 points is a random number generator with good prose, not a
  judgment.

Not wired into `npm run verify` or CI. Run manually before merging a prompt
change to `validate-idea.ts`; at `mid` tier × ~25 ideas × 3 runs for
stability, this costs roughly a dollar per full run — trivial against the
$50/month cap, but real money, so it stays a deliberate manual action.

### 3. The report

A markdown report (`docs/eval/calibration-report.md` or similar), written
once results exist, stating the actual numbers plainly — including if they're
unflattering. An honest "62% kill precision, here's where it's wrong" is more
credible than a suspiciously perfect number.

---

## Acceptance

```bash
npx tsx tests/eval/run.ts
```

- Eval set has 20+ entries with a genuine mix of outcomes, not all obvious
- Harness reports calibration, kill precision, and stability numbers
- A deliberately bad prompt edit (e.g. removing `whyNot`) measurably degrades
  at least one of the three numbers, proving the harness detects regressions
- Calibration report exists and states real numbers, not placeholders

---

## Risks

| Risk | Mitigation |
|---|---|
| Eval set is too small to mean anything statistically | Stated honestly in the report as a limitation, not hidden; grows over time |
| Running the harness costs real money | Manual trigger only, ~$1/run, never in CI |
| A bad number is embarrassing to publish | Publishing it anyway is the point — see §7.3 of the review: no competitor in this space makes any falsifiable claim at all |

---

## Peerlist posts

**A — LESSON:** *"I measured whether my own kill verdict is any good."*
The eval harness, the historical idea set including famous false negatives,
and the actual calibration/kill-precision numbers — published honestly, flaws
included. The category-defining claim: no competitor in this space publishes
a falsifiable accuracy number for their AI's judgment. Show the harness. Ask:
would you trust an AI's "kill this" if you'd never seen its track record?
