# Every AI idea-validator I've used is a hype machine

**Publish date:** 2026-08-04

Ask a model to evaluate a startup idea and it scores 80. Ask it about a
genuinely bad one and it still scores 75. I didn't want to build a fourth
version of that.

**What I hit:** models are agreeable by default. Left alone, a validation
prompt behaves like a generous friend, not a partner who's seen 200 pitches
and funded three.

**What I tried first:** the obvious fix -- just ask nicely for honesty.
"Please be critical" in the prompt barely moves the score distribution. Vague
instructions get vague compliance.

**What worked:** three concrete changes, not one prompt tweak.
1. Calibration by explicit distribution: "most ideas you see should score
below 50," not "be critical."
2. A required `whyNot` field in the schema -- omittable fields get omitted,
required ones get answered.
3. Reconciling the model's own recommendation against its own score band in
code, not trusting its self-classification:

```ts
const band = score < 40 ? "kill" : score < 70 ? "refine" : "build";
if (recommendation !== band) recommendation = band; // the score wins
```

**Why this way:** models are measurably better at producing a calibrated
number than at correctly bucketing their own number into a label. Don't ask
it to do the second job -- do it in code, where it's five lines and always
right.

**What it costs:** the mock/demo fixture is deliberately a kill verdict
(score 34), so anyone trying the product with no API key sees the system's
least flattering, most honest mode first. That was a deliberate call, not an
accident -- it's the actual product, not a watered-down demo.

How do you stop an LLM from just agreeing with you?

#buildinpublic #nucleus2 #llm

---

## Visual (production note — not part of the post)

**Type:** Screenshot (live app)

This one's directly capturable today, and demo mode makes it deterministic:

1. Run the dashboard with no API key configured (demo mode).
2. Click "New Idea," type any idea, click Analyze.
3. The fixture returns a kill verdict (score 34) — screenshot the result
   screen once it renders, framed so the score badge (red/kill), the
   recommendation, and the `whyNot` paragraph are all visible together. If
   risks are visible without scrolling, even better — the point is "required
   field, not a vibe," so the more of the honest-verdict structure is on
   screen at once, the better it lands.
