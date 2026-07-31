# PHASE 13 — CALIBRATION

> **New phase, inserted by `docs/reviews/2026-07-30-stack-position.md` §5.5
> and §8, adopted.**
>
> **MOVED 2026-07-31: runs BEFORE Phase 11, not after Phase 12.** The
> original placement is preserved below, struck through, because the reason
> it was wrong is more useful than the correction.
>
> ~~Deliberately placed after Phase 12 (ship), not before — a calibration
> report is a credibility asset, and credibility assets are worthless before
> anyone is looking.~~
>
> That inverts the causation. A credibility asset is not something you
> publish *once* people are looking; in a category where no competitor
> publishes any falsifiable accuracy claim at all, it is the thing that
> **makes** people look. Waiting for an audience before producing the only
> artifact capable of earning one is a deadlock, and it is the same deadlock
> that killed 1.0 — lessons #2, #3, #11.
>
> The second reason is not about marketing at all. This harness is the only
> check on the product's central claim, and the claim ships in Phase 12.
> Running it after ship means shipping an unverified `kill` verdict and
> finding out afterwards. Publishing the harness is simultaneously the
> credibility act and the QA act; that coincidence is the tell that the
> ordering was backwards.

**Goal:** an evaluation harness that makes "did that prompt change make
validation better or worse" an answerable, non-vibes question — and the
strongest marketing artifact the project can produce.

**Why now:** the product's central claim is *the willingness and ability to
say kill*. There is currently no way to verify that claim beyond reading the
prose and nodding, and every edit ever made to `validate-idea.ts` has been
unverifiable. The original "wait for real users and resolved predictions"
argument would strengthen a *future* revision of this report — it does not
justify shipping the claim unmeasured in the meantime. Run it now against
historical outcomes; re-run it later against the user's own resolved
predictions, which is a strictly better version of the same report.

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

### 1. The eval set — `tests/eval/ideas.json` ✅ built

**Built 2026-07-31: 34 ideas** — 15 succeeded, 15 failed, 4 `unknown`.

Two deviations from the spec below, both deliberate:

- **Every idea is written as it would have been pitched at the time.** No
  hindsight, no outcome words. An entry that leaks its own answer measures
  nothing.
- **A `contamination` field was added** (`high`/`medium`/`low`). A frontier
  model recognises the air-mattress idea and is then scoring its memory of
  the outcome, not the pitch. Unfixable, so it is measured instead: the
  harness reports every number twice, once over all 34 and once over the 19
  non-`high` entries (17 of them outcome-labelled). The second number is the
  honest one and the report says so. Six extra low-contamination entries were
  added specifically to keep that denominator from being too thin to publish.

20–30 historical startup ideas with known outcomes, deliberately including:
- famous false negatives investors passed on (Airbnb, Dropbox, Airbnb-style
  "nobody will [X]" cases) — a calibrated system should score these higher
  than a naive skeptic would
- obvious duds — a calibrated system should score these low and recommend
  `kill`
- ambiguous middle cases — where reasonable people disagree, and the
  interesting output is *why*, not just the score

Each entry: `{ idea: string, actualOutcome: "succeeded" | "failed" | "unknown" }`.

### 2. The harness — `tests/eval/run.eval.ts` + `tests/eval/score.ts` ✅ built

**Built 2026-07-31.** Four decisions worth recording, each with what was
rejected:

**Run it through vitest, not `tsx`.** Acceptance below said
`npx tsx tests/eval/run.ts`. `tsx` is not installed, and adding it would need
a Dependency Ledger row to buy a job vitest already does — it resolves the
`@` alias and runs TypeScript today. So: `npm run eval`, backed by
`vitest.eval.config.ts`, whose include glob is *only* this file. `npm run
verify` stays free, offline and deterministic.

**The scoring math is a separate pure module, unit-tested for free.**
`score.ts` has no I/O, no AI and no clock, so `tests/eval/score.test.ts` runs
in the normal suite at zero cost. These functions encode the numbers the
project intends to publish about itself; they should not be exercised only by
a run that costs money.

**`score.ts` re-declares the score bands instead of importing
`reconcileVerdict`'s.** If the eval imported the product's band logic, a
change to the bands would move the yardstick and the thing being measured
together, and the harness would report no regression. The eval has to be able
to disagree with the product.

**A third metric was added: `falseKillRate`.** Calibration and kill precision
are each individually gameable — a validator that never kills anything has an
undefined kill precision and a perfect false-kill rate. Reported together the
three have no cheap winning strategy, and `falseKillRate` is the Airbnb
number: *of the ideas that actually succeeded, how many did we kill?* That is
the one a reader will care about most.

**Defect found and fixed while building this: the cache silently faked the
stability number.** `cacheKey` is `sha256(task:model:prompt)`, so runs 2..n
of an identical idea were served from run 1 and variance was always exactly
0 — the harness would have reported perfect stability regardless of how
unstable the model is, which is worse than reporting nothing. Fixed with
`RunTaskOpts.bypassCache`, a flag with exactly one caller. It does not weaken
the budget guard: preflight already runs above the cache lookup, so a
bypassed call is metered like any other. It also skips `putCached`, keeping
~100 eval entries out of the founder's working cache.

Runs `validate-idea` against every entry in the eval set (real provider,
`mid` tier — this costs real money, see below) and computes:

- **calibration** — of ideas scored 70+, what fraction actually succeeded?
- **kill precision** — of ideas scored `kill`, what fraction actually failed?
- **false kill rate** — of ideas that actually succeeded, what fraction did
  we kill?
- **stability** — same idea, three runs, score variance, reported as mean
  std dev, *max* std dev (one unstable verdict is the story, not the
  average), and a count of ideas whose band flipped between runs. A verdict
  that swings ±25 points is a random number generator with good prose, not a
  judgment.

Not wired into `npm run verify` or CI. Run manually before merging a prompt
change to `validate-idea.ts`; at `mid` tier × 34 ideas × 3 runs for
stability, this is ~102 calls and costs roughly $1–1.50 per full run —
trivial against the $50/month cap, but real money, so it stays a deliberate
manual action. It is metered through the gateway like everything else, so it
draws down the same daily cap; run it on a day with headroom.

The harness **refuses to run in demo mode**. Scoring the fixture would score
a constant verdict and produce a confident, meaningless report — worse than
no report. It throws instead.

Cheaper variants: `EVAL_RUNS=1 npm run eval` (no stability number, ~1/3 the
cost), `EVAL_LIMIT=5 npm run eval` (first five ideas, for smoke-testing the
plumbing).

### 3. The report

A markdown report at `docs/eval/calibration-report.md`, generated by the
harness, stating the actual numbers plainly — including if they're
unflattering. An honest "62% kill precision, here's where it's wrong" is more
credible than a suspiciously perfect number.

---

## Acceptance

```bash
npm run eval          # not `npx tsx` — see §2
```

- [x] Eval set has 20+ entries with a genuine mix of outcomes, not all
      obvious — **34, split 15/15/4**
- [x] Scoring math unit-tested at zero cost — `tests/eval/score.test.ts`
- [x] Stability cannot silently report a fake 0 — cache bypass, plus a
      regression test asserting `stdDev([50,50,50]) === 0` is distinguishable
      from a single-run `null`
- [ ] **Founder action:** run `npm run eval` with a key configured. Harness
      reports calibration, kill precision, false kill rate and stability
- [ ] **Founder action:** a deliberately bad prompt edit (e.g. removing the
      `whyNot` requirement from `validate-idea.ts`) measurably degrades at
      least one number, proving the harness detects regressions. Do this
      *after* the clean baseline run, and revert the edit
- [ ] Calibration report exists at `docs/eval/calibration-report.md` and
      states real numbers, not placeholders

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
