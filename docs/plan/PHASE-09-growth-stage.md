# PHASE 09 — GROWTH STAGE

**Goal:** the launched venture gets a content plan, real posts, and honest
metrics.

> **Re-shaped by `docs/reviews/2026-07-30-stack-position.md` §8, adopted.**
> `MetricEntry` (§3 below) is superseded by the `Observation` primitive added
> in Phase 08.5 — same shape in spirit (venture, date, a value, a note), but
> its `metric` field is designed to match a `Prediction`'s `metric`, so
> resolving one is a join, not a human squinting at a chart. The growth
> view's primary widget is an **open-predictions list with due dates**, not a
> chart — resolving a prediction is one click and writes back to
> `Prediction.status`. Steps 1, 2, and 4 (the content calendar, on-demand post
> generation, and the growth view housing all of this) are unchanged from the
> original spec below.

**Why now:** the launch page is live and nobody knows. This is the stage that
makes "we build businesses, not apps" literally true — and it is the stage
every competitor omits entirely.

---

## Scope

**In:** `write-content-calendar` and `write-post` tasks, content artifacts,
manual metric entry, growth view, weekly review.

**Out of scope:** auto-posting to any platform (Backlog — needs OAuth per
platform; drafts are the honest v1). Analytics integrations. Paid ads. Email
sequences.

---

## Steps

### 1. `write-content-calendar` task

Tier `mid`. Input: venture + plan (ICP, `where`, positioning).

```ts
const CalendarSchema = z.object({
  strategy: z.string(),                  // the angle, in one paragraph
  channels: z.array(z.object({
    channel: z.string(),                 // must come from the plan's ICP `where`
    why: z.string(),
    cadence: z.string(),
  })).min(2).max(4),
  posts: z.array(z.object({
    day: z.number().min(1).max(28),
    channel: z.string(),
    angle: z.string(),
    hook: z.string(),                    // the actual opening line
    type: z.enum(["story","teardown","result","question","build-log"]),
  })).length(12),                        // 4 weeks, 3/week
});
```

Channels must be drawn from the plan's ICP `where` field. Say so in the
prompt. A content calendar that ignores the audience research is generic
advice, and generic advice is what the user could have got for free.

`hook` forces the model past topic-listing into actual writing. "Post about
your launch" is worthless; the opening line is the whole job.

### 2. `write-post` task

Tier `mid`. Input: a calendar entry + venture context. Expands one row into a
finished draft.

Generated on demand, one at a time. **Do not batch-generate twelve posts** —
that is 12× the cost for content the user will mostly not use. Generate on
click. This is a budget decision and it belongs in the post.

### 3. Metrics — manual, honest, and now attributable

Superseded by the `Observation` primitive (`src/lib/domain.ts`, added in
Phase 08.5) rather than a new `MetricEntry` type — see the callout at the top
of this file:

```ts
const ObservationSchema = z.object({
  id: z.string(), ventureId: z.string(), observedAt: z.string(),
  metric: z.string(), value: z.number().nullable(), note: z.string().nullable(),
  source: z.enum(["manual", "deploy", "import"]).default("manual"),
  createdAt: z.string(),
});
```

Weekly manual entry. No integrations. The UI work is the same as originally
specced (a form, a chart) — only the underlying type changed, so an
`Observation` whose `metric` matches an open `Prediction`'s `metric` can
resolve it in one click instead of requiring a human to notice the
connection.

Justification worth stating plainly: for a solo founder with 40 visitors,
typing a number once a week takes eleven seconds and costs nothing, while
integrating Plausible/GA/Stripe costs three OAuth flows, a webhook receiver,
and a permanent maintenance surface. Build the integration when the number
gets big enough to be annoying to type.

```
ponytail: manual weekly entry. Add an analytics integration when a user
actually complains about typing it.
```

Chart: signups over time. Read the `dataviz` skill first.

### 4. Growth view

In the venture workspace: strategy, channel table, the 12-post calendar with a
Generate button per row, an **open-predictions list with due dates** (the
primary widget — each row resolves in one click against a matching
`Observation`), a metrics chart underneath it, and the plan's `killCriteria`
shown against actual numbers.

That last element is the product's soul: at the growth stage, Nucleus shows
you the kill criteria **you wrote at planning time**, next to your real
numbers. It is the mechanism that makes the studio honest with you when you're
least inclined to be honest with yourself.

### 5. Weekly review

A `weekly-review` task (tier `cheap` — it summarises data it's given, no
reasoning depth needed). Input: metrics + events from the last 7 days. Output:
what moved, what didn't, one recommended action, and an explicit
kill-criteria check.

Manual trigger only. No cron, no scheduler.

---

## Acceptance

```bash
npm run verify
```

- Calendar channels are a subset of the plan's ICP `where` (test with a
  fixture where they diverge — the test should catch it)
- Calendar has exactly 12 posts; schema rejects 11 or 13
- Generating a post makes exactly **one** AI call, not twelve (assert the
  count)
- Observation entry, persistence, and chart render in both themes
- Resolving a prediction against a matching Observation sets `Prediction.status`
  and `resolvedBy` -- not just a UI toggle
- Kill criteria display against real numbers
- Browser-verified, screenshots read

---

## Risks

| Risk | Mitigation |
|---|---|
| Generic "post on Twitter" advice | Channels constrained to ICP research; `hook` field forces real writing; spot-check and record honestly |
| 12 posts × frontier tier destroys the budget | `mid` tier, generated one at a time on demand, cached |
| Manual metrics never get entered | Accepted. A dashboard nobody updates is the founder's signal too — and honest about it |
| Content sounds like an AI wrote it | Prompt includes the founder's actual voice from `docs/content/drafts/`. Dogfooding: the tool that writes Nucleus's own posts should sound like the person writing them |

---

## Peerlist posts

**A — SHIP:** *"My AI venture studio now does the part everyone skips:
distribution."*
Show a generated calendar for a real venture — channels drawn from the actual
audience research, 12 posts with real hooks, not "post about your launch." The
differentiator sentence: every AI builder stops at "here's your app" and leaves
you alone with the hard part. Screenshot the kill-criteria-vs-actuals panel.

**B — LESSON:** *"I generate one post at a time on purpose."*
The obvious build is generating all 12 drafts up front. That's 12× the cost
for content the user mostly won't use — and on a $50/month cap, laziness is
architecture. Generate on click, cache the result, done. Then the wider
pattern: the budget constraint has made this codebase *better*, not worse. It
killed batch generation, it killed an AI call that a `map` handled, it forced
tier routing. Constraints as a design tool. Ask: what did a hard budget stop
you from over-building?
