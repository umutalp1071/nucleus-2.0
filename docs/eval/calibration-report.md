# CALIBRATION REPORT

**Generated:** 2026-07-31 · 
**Model:** `anthropic/claude-haiku-4.5` · **Prompt version:** `0a5ba7ad1416` · 
**Ideas:** 34 · **Runs each:** 3 · 
**Cost of this report:** $0.3597

This measures whether Nucleus's `kill` verdict is worth anything. The
numbers below are whatever they are. An unflattering number published
is worth more than a flattering number withheld -- no competitor in
this category publishes any falsifiable accuracy claim at all.

### All ideas
| Metric | Value | Denominator |
|---|---|---|
| Calibration (scored 70+, actually succeeded) | n/a | 0 |
| Kill precision (killed, actually failed) | 54% | 28 |
| False kill rate (succeeded, we killed) | 87% | 15 |
| Mean score std dev across runs | 1.5 | 34 |
| Max score std dev across runs | 4.7 | 34 |
| Ideas whose band flipped between runs | 2 | 34 |

Band flips: s06, s12

### Excluding high-contamination ideas
| Metric | Value | Denominator |
|---|---|---|
| Calibration (scored 70+, actually succeeded) | n/a | 0 |
| Kill precision (killed, actually failed) | 56% | 16 |
| False kill rate (succeeded, we killed) | 88% | 8 |
| Mean score std dev across runs | 1.6 | 19 |
| Max score std dev across runs | 4.7 | 19 |
| Ideas whose band flipped between runs | 1 | 19 |

Band flips: s12

## How to read this

**Contamination is the main limitation.** Famous cases are in the
model's training data. When it scores the air-mattress idea highly it
may be recalling the outcome rather than judging the pitch. The second
table drops every idea marked `high` and is the more honest number,
at the cost of a smaller denominator.

**The three accuracy numbers are reported together because no two of
them can be gamed at once.** A validator that never kills anything has
an undefined kill precision and a 0% false kill rate, and gets punished
on calibration. One that kills everything inverts that. Only genuine
discrimination moves all three.

**Stability is the one that decides whether any of this means
anything.** A verdict that swings 25 points between identical runs is a
random number generator with good prose, and its calibration score is
an artifact of sampling.

**The set is small.** Twenty-odd ideas cannot support a confidence
interval. Treat every percentage here as directional.

## Per-idea results

| id | outcome | contamination | scores | band |
|---|---|---|---|---|
| s01 | succeeded | high | 28, 28, 28 | kill |
| s02 | succeeded | high | 8, 8, 8 | kill |
| s03 | succeeded | high | 28, 28, 28 | kill |
| s04 | succeeded | high | 15, 8, 8 | kill |
| s05 | succeeded | high | 18, 18, 18 | kill |
| s06 | succeeded | high | 42, 42, 38 | refine |
| s07 | succeeded | medium | 28, 28, 38 | kill |
| s08 | succeeded | medium | 28, 28, 28 | kill |
| s09 | succeeded | high | 28, 28, 22 | kill |
| s10 | succeeded | medium | 28, 32, 28 | kill |
| s11 | succeeded | medium | 38, 28, 28 | kill |
| s12 | succeeded | medium | 42, 38, 38 | refine |
| f01 | failed | high | 18, 18, 18 | kill |
| f02 | failed | high | 28, 28, 28 | kill |
| f03 | failed | high | 28, 28, 28 | kill |
| f04 | failed | high | 28, 28, 38 | kill |
| f05 | failed | high | 18, 18, 22 | kill |
| f06 | failed | high | 28, 18, 18 | kill |
| f07 | failed | medium | 18, 18, 18 | kill |
| f08 | failed | low | 28, 28, 28 | kill |
| f09 | failed | low | 28, 28, 28 | kill |
| f10 | failed | low | 28, 28, 38 | kill |
| f11 | failed | low | 22, 28, 28 | kill |
| f12 | failed | low | 28, 28, 28 | kill |
| s13 | succeeded | low | 28, 28, 28 | kill |
| s14 | succeeded | low | 28, 28, 28 | kill |
| s15 | succeeded | low | 22, 28, 22 | kill |
| f13 | failed | low | 38, 38, 38 | kill |
| f14 | failed | low | 28, 28, 28 | kill |
| f15 | failed | low | 28, 22, 18 | kill |
| u01 | unknown | high | 28, 32, 32 | kill |
| u02 | unknown | high | 18, 18, 18 | kill |
| u03 | unknown | medium | 28, 28, 28 | kill |
| u04 | unknown | low | 32, 38, 38 | kill |
