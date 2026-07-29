# A dashboard that shows your spending is not a budget

**Publish date:** 2026-08-02

I almost built a spend meter first. Glad I didn't.

**What I hit:** the obvious version of "budget tracking" is a number that goes
up as you spend, with a red state past some threshold. That's monitoring. By
the time it turns red, the money you were trying to protect is already gone —
the check happened after the fact, not before it.

**What I tried first:** nothing, actually — caught it while writing the
gateway's sequence diagram, not in code. Worth naming the failure mode
anyway, because it's the default shape almost every "AI cost tracking"
tutorial reaches for.

**What worked:** a three-way decision — `ok | downgrade | block` — computed
*before* any request goes out, derived by summing a ledger instead of reading
a counter.

```ts
const headroom = cap - spent;
if (headroom <= 0) return { decision: "block", window, capUsd: cap, spentUsd: spent };
if (estimatedUsd > headroom) return { decision: "downgrade", headroomUsd: headroom };
return { decision: "ok" };
```

`spent` is `SUM(costUsd)` over the ledger for that time window, recomputed
every call. Never a running counter — a counter can drift out of sync with
reality; a sum over the actual rows can't.

**Why this way:** "downgrade" is the interesting branch. It's not block-or-
allow — if the estimate doesn't fit but there's still headroom, the gateway
drops to a cheaper model tier and tries again, only truly blocking if even
the cheapest allowed tier won't fit.

**What it costs:** every call now needs a cost *estimate* before it knows the
real answer, using a `chars/4 ≈ tokens` approximation. That estimate is
deliberately biased to round up — meaning Nucleus will occasionally refuse a
request that would technically have fit. Given the alternative is silently
exceeding a hard budget, that's the trade I want.

Has anyone actually shipped pre-flight cost control on an LLM feature, or
does everyone just watch the graph and hope?

#buildinpublic #nucleus2 #llm

---

## Visual (production note — not part of the post)

**Type:** Screenshot (terminal)

There's no budget UI yet at this point (Settings/spend breakdown ships in
Phase 05) — prove the claim with the test suite instead of a mock graphic.

Run `npx vitest run tests/budget.test.ts --reporter=verbose` and screenshot
the output. Make sure the three named cases for `ok`, `downgrade`, and
`block` decisions are all visible and passing in the same frame — that list
of three outcomes *is* the point of the post, more convincing than a diagram
of something that isn't built yet.
