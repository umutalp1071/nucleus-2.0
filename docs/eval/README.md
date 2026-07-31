# CALIBRATION HARNESS

Measures whether `validate-idea`'s judgment is any good, against 34 historical
startup ideas with known outcomes.

This is the only check on the product's central claim — *the willingness and
ability to say kill*. Phase 12 ships that claim, so this runs before it.

## Run it

```bash
npm run eval                 # full: 34 ideas x 3 runs, ~102 calls, ~$1-1.50
EVAL_RUNS=1 npm run eval     # no stability number, ~1/3 the cost
EVAL_LIMIT=5 npm run eval    # first 5 ideas, for smoke-testing the plumbing
```

Requires a real provider key. In demo mode the harness throws rather than
score the fixture — a fixed verdict would produce confident, meaningless
numbers, which is worse than no numbers.

Spend is metered through the gateway like everything else, so it draws down
the same daily cap. Run it on a day with headroom.

Writes `docs/eval/calibration-report.md`. Not in `npm run verify` and never
in CI.

## What it reports

| Metric | Question |
|---|---|
| Calibration | Of ideas we scored 70+, how many actually succeeded? |
| Kill precision | Of ideas we killed, how many actually failed? |
| False kill rate | Of ideas that actually succeeded, how many did we kill? |
| Stability | Same idea, three runs — mean and max score std dev, plus band flips |

The three accuracy numbers are reported together because no two of them can
be gamed at once. A validator that never kills anything has an undefined kill
precision and a perfect false kill rate, and gets punished on calibration.
One that kills everything inverts that. Only genuine discrimination moves all
three.

Stability decides whether any of the other numbers mean anything. A verdict
that swings 25 points between identical runs is a random number generator
with good prose, and its calibration score is an artifact of sampling.

## Known limitations, stated up front

**Contamination.** Frontier models have Airbnb and Dropbox in training data.
When the model scores the air-mattress idea highly it may be recalling the
outcome rather than judging the pitch. Not fixable, so it is measured: each
idea carries `contamination: high | medium | low`, and every number is
reported twice — once over all 34, once over the 19 non-`high` entries (17
outcome-labelled). **The second table is the honest one.**

**Sample size.** Seventeen clean ideas cannot support a confidence interval.
Every percentage is directional. Say so in anything published from it.

**Survivorship in the failures.** The failed set skews toward famous failures
and obvious duds. Quiet, plausible-sounding failures are the hard case and
are under-represented.

**The `unknown` four** are genuinely contested (audio-social, connected
fitness hardware, meal kits, browser AI assistants). They count toward
stability but toward neither numerator nor denominator of any accuracy
metric. Kept because the interesting output for these is the reasoning.

## Before merging a prompt change

Run it, compare against the last report, and note the delta in the commit.
Every edit to `validate-idea.ts` before 2026-07-31 was unverifiable; that is
the thing this exists to end.

## Regression check (do this once)

Establish a clean baseline, then deliberately break the prompt — remove the
`whyNot` requirement from `validate-idea.ts` — and re-run. At least one
number must measurably degrade. If nothing moves, the harness is not
measuring what it claims to and the report should not be published. Revert
the edit afterwards.
