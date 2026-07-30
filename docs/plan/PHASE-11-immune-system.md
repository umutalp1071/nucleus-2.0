# PHASE 11 — IMMUNE SYSTEM

**Goal:** the system notices its own failures, records them as data, and
recovers.

**Why now:** ten phases of surface area exist. The vision's 4th character
principle is "Immune System 🛡️ — self-healing, self/non-self distinction,
adaptive," and lessons #9 and #14 demand permanent memory and a system that
learns. So far that memory is markdown a human writes. This phase makes it
automatic.

---

## Scope

**In:** structured error capture, the mistake DB as data, health checks,
recovery paths, automated vision-drift check, cost anomaly detection.

> **Extended by `docs/reviews/2026-07-30-stack-position.md` §8, adopted.**
> "The system notices its own failures" extends from *crashes* to *bad
> judgment*, now that Phase 08.5's `Decision`/`Prediction` data exists to
> notice it in: calibration drift (the same idea re-validated returns a
> meaningfully different score), verdict instability across reruns (three
> runs of the same idea, score variance — a verdict that swings ±25 points is
> a random number generator with good prose), and predictions systematically
> overshooting or undershooting their target. Same machinery (structured
> incident capture), applied to the model's output rather than the runtime's.

**Out of scope:** external monitoring services. Alerting/paging. APM. Sentry
(a local-first single-operator app has nowhere to send telemetry, and
shouldn't).

---

## Steps

### 1. Error capture

```ts
// src/server/incidents.ts
export async function recordIncident(i: {
  where: string; what: string; severity: "low"|"medium"|"high";
  recovered: boolean; payload?: unknown;
}): Promise<void>;
```

Wired into the paths that already know they can fail:
- store: corrupt JSON recovery (from Phase 01, which currently only
  `console.error`s — upgrade it here)
- gateway: schema validation failure, provider error, budget block
- deploy: failure
- route handlers: unhandled exceptions, via one shared wrapper

Redact secrets before writing. Reuse the Phase 05 redaction helper.

### 2. Mistake DB as data

`docs/mistakes/` is currently hand-written markdown following a template.
Keep the human entries — the Nucleus 1.0 lessons are genuinely valuable
writing and must not be deleted.

Add `.nucleus/incidents.json` for machine-recorded ones, and a `/health` view
that shows both. **Repeat detection:** an incident with the same
`where + what` signature occurring 3+ times gets flagged as a pattern.

"Never make the same mistake twice" becomes a query rather than a hope.

### 3. Recovery paths

Each failure gets an actual recovery, not just a log line:

| Failure | Recovery |
|---|---|
| Corrupt collection file | Restore the newest good backup, record the incident, tell the user what was restored and from when |
| Provider 5xx / timeout | Retry once with backoff, then downgrade tier, then fail readably |
| Provider 429 | Fail readably with a retry-after; do **not** hammer |
| Schema failure twice | Already handled (Phase 02); now also records an incident with the raw output for prompt debugging |
| Missing `.nucleus/` | Create it silently. Not an error |

**TDD the backup-restore path.** It is the one that protects user data and the
one least likely to be exercised naturally.

### 4. Health checks — `/api/health` (extend)

- data dir writable
- every collection parses
- AI mode + key validity (cached, not a live call on every request)
- spend vs caps, with days remaining in the window
- **pricing table age** — flag if `models.ts` hasn't been reviewed in 90 days.
  A stale price table means every cost estimate is silently wrong, which
  silently breaks the budget guard. This is the highest-value check here.
- repeated-incident patterns

Surface as a small status indicator in the header. Green is invisible;
problems are visible.

### 5. Cost anomaly detection

A call costing >3× the running median for its task records a `medium`
incident. Catches a runaway prompt, a bad input, or a pricing change before it
eats the monthly budget rather than after.

Median over the last 20 calls for that task. `ponytail: median of 20, not a
model. Statistics, not ML.`

### 6. Automated vision-drift check

`docs/workflow/prompts/vision-check.md` describes a manual bi-weekly review.
Automate it: a `vision-check` task (tier `mid`) taking the last N phase
completions and `PROGRESS.md` decisions, scoring alignment against
`00-ANSWER.md` §1's four requirements, and flagging drift.

Manual trigger. Output goes to `PROGRESS.md`, not just the screen.

Lesson #8 says small technical decisions slowly move the project away from the
vision. This is the automated defence, and running it on the plan that
produced it is a nice closing loop.

---

## Acceptance

```bash
npm run verify
```

- Corrupt `.nucleus/ventures.json` on purpose → app loads, backup restored,
  incident recorded, user told. **Actually do this**, don't just write the
  test.
- Provider 500 → retry → downgrade → readable failure, incident recorded
- Same incident 3× → flagged as a pattern in `/health`
- Pricing-table staleness check fires when the date comment is backdated
- Cost anomaly fires on an artificially expensive call
- Vision check runs and writes to `PROGRESS.md`
- No secret appears in any incident payload (test it)

---

## Risks

| Risk | Mitigation |
|---|---|
| Incident log grows unbounded | Cap at 1000, prune oldest, keep aggregate counts per signature |
| Secrets leak into incident payloads | Central redaction + an explicit test |
| Health check becomes slow | Cache for 30s; no live network calls in the request path |
| Vision check becomes a rubber stamp | It scores against the four concrete requirements in `00-ANSWER.md` §1, not vibes |

---

## Peerlist posts

**A — SHIP:** *"My app now files its own bug reports."*
Structured incident capture with automatic repeat-detection: the same failure
signature three times gets flagged as a pattern. Plus the health check I
didn't expect to need most — a staleness alarm on the model pricing table,
because if those numbers drift the entire budget guard is quietly computing
the wrong answer while looking perfectly green.

**B — LESSON:** *"'Never make the same mistake twice' is a hope until it's a
query."*
I had a `docs/mistakes/` folder with a nice template. Beautifully written,
never consulted — because grepping your own markdown at 1am is not a thing
anyone does. So mistakes became rows with a `where + what` signature and a
count. The human-written lessons stayed (they're genuinely good writing); the
machine-detected ones got a schema. Honest cost: structured data is worse to
read than prose, so both exist, and that's the right answer. Ask: does your
post-mortem doc actually get read, or does it get written?
