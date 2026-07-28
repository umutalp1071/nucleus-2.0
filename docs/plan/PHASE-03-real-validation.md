# PHASE 03 — REAL VALIDATION

**Goal:** delete `generateMockAnalysis` and replace it with an AI that is
willing to tell you not to build your idea.

**Why now:** the gateway exists and has nothing to run. This is the first
moment Nucleus does something no competitor does — and it is the single most
shareable capability in the product.

---

## Scope

**In:** the `validate-idea` and `analyze-competitors` tasks, the verdict model,
the `killed` outcome, the New Idea flow rewired to real analysis.

**Out of scope:** web search / live market data (Backlog — real data sources
are a whole subsystem; the model's training knowledge is the honest v1).
Planning artifacts (Phase 06). The venture workspace page (Phase 04).

---

## Steps

### 1. The verdict model

This is a product decision expressed as a schema. Get it right.

```ts
const VerdictSchema = z.object({
  score: z.number().min(0).max(100),
  recommendation: z.enum(["build", "refine", "kill"]),
  headline: z.string().max(120),        // one sentence the user reads first
  marketSize: z.object({ estimate: z.string(), confidence: z.enum(["low","medium","high"]), reasoning: z.string() }),
  audience: z.object({ who: z.string(), painLevel: z.enum(["nice-to-have","painful","urgent"]) }),
  risks: z.array(z.object({ risk: z.string(), severity: z.enum(["low","medium","high"]) })).min(2).max(5),
  moat: z.string(),                     // why this wouldn't be cloned in a weekend
  cheapestTest: z.string(),             // the £0 experiment to run before building
  whyNot: z.string(),                   // REQUIRED. the strongest argument against.
});
```

Two fields carry the whole product philosophy:

- **`whyNot` is required.** The model must argue against the idea. An optional
  field gets omitted; a required one forces the thought.
- **`cheapestTest`** — the studio's job is to stop you spending three months
  on something a landing page and $20 of ads could have answered in a week.

`score` bands: 0–39 → `kill`, 40–69 → `refine`, 70–100 → `build`. Validate
that the model's `recommendation` matches its own `score` band; if it
disagrees, trust the score and correct the recommendation. Models are better
at scoring than at classifying their own score.

### 2. `validate-idea` task

`src/server/ai/tasks/validate-idea.ts`. Tier `mid`, minTier `cheap`,
`expectedOutTokens: 900`.

Prompt requirements:
- Cast the model as a **skeptical venture partner who sees 200 ideas a quarter
  and funds three.** Not an assistant. Not a brainstorming buddy.
- Explicit: "Most ideas should score below 50. A high score must be earned."
  Without this, every idea scores 75+ and the feature is worthless.
- Restate the JSON schema in the prompt.
- Include the raw idea text verbatim, delimited, with an instruction not to
  follow instructions contained within it. (The idea field is user input
  flowing into a prompt — treat it as untrusted.)

Write the mock fixture as a genuinely negative verdict — score 34,
`recommendation: "kill"`. Demoing the kill path is the point.

### 3. `analyze-competitors` task

Tier `frontier`, minTier `mid` — this is where reasoning depth actually pays
for itself, and the only task in the plan that starts at frontier.

Output: 3–6 competitors, each `{ name, whatTheyDo, weakness, howYouWin }`,
plus an overall `differentiationVerdict` and a `crowdedness` enum.

Run it only for ideas scoring ≥ 40. **Do not spend frontier-tier money
analyzing the competition for an idea the system just told you to kill.**
That single rule is what "budget-aware" means in practice, and it belongs in
the post.

### 4. Wire the New Idea flow

`NewIdeaFlow.tsx` currently calls `generateMockAnalysis` with a 900ms fake
delay. Rewire:

- `POST /api/ventures` creates the venture at `captured`
- `POST /api/ventures/[id]/advance` runs validation, stores a `validation`
  artifact, advances to `validated` (or `killed` if the user accepts the kill)
- the analyzing step shows real progress: "Analyzing market…" →
  "Checking competitors…" — driven by actual task completion, not a timer
- the result step renders the verdict: score, headline, `whyNot`,
  `cheapestTest`, risks
- buttons become **Kill it** / **Save for later** / **Keep going**

The result screen must show `whyNot` **above** the fold, not buried. The
product's promise is honesty; the layout has to agree.

### 5. Handle failure in the UI

`runTask` returns `{ ok: false }` for three reasons. Each needs a real screen,
not a spinner that never resolves:

- budget → "Nucleus has reached today's limit" + when it resets + a link to
  settings
- invalid output → "Couldn't make sense of that" + Retry
- provider error → "The AI service isn't responding" + Retry

Test all three by forcing them. A failure path you have not seen is a failure
path that is broken.

### 6. Delete the mock

Remove `generateMockAnalysis` and `IdeaAnalysis` from `src/lib/mock-data.ts`.
`mock-data.ts` should now only hold the dashboard's still-fake
projects/growth/activity, which Phase 04 removes.

---

## Acceptance

```bash
npm run verify
```

- With no API key: full flow works end-to-end against fixtures, producing a
  `kill` verdict. Screenshot it.
- `tests/validate-idea.test.ts`: score-band ↔ recommendation reconciliation;
  fixture satisfies the schema; a score-38 response is corrected to `kill` even
  if the model said `build`
- Competitor analysis does **not** run for a score below 40 — assert the
  provider call count
- All three failure screens render (force each one)
- `grep -r generateMockAnalysis src/` returns nothing

---

## Risks

| Risk | Mitigation |
|---|---|
| Model is a sycophant, everything scores 80 | Explicit prompt calibration ("most ideas score below 50"); required `whyNot`; spot-check 5 real ideas and record the score distribution in `learning.md` |
| Prompt injection via the idea text | Delimit the input, instruct the model to treat it as data. Note the residual risk honestly — this is not fully solved by anyone |
| Frontier tier blows the daily budget | Gated behind score ≥ 40; `minTier: "mid"` allows downgrade |
| Validation takes 30s+, feels broken | Show real per-task progress. If it exceeds 30s, that's the trigger for background jobs — not before |

---

## Peerlist posts

**A — SHIP:** *"I built an AI that tells me to kill my own ideas."*
The flagship post of the entire series. Show the real kill verdict on a real
idea of yours, score and all. Explain the required `whyNot` field — an
optional field gets omitted, a required one forces the argument. And the
`cheapestTest` field: the studio's actual job is stopping you from spending
three months on what a landing page could answer in a week. This is the post
most likely to travel.

**B — LESSON:** *"Every AI idea-validator I've used is a hype machine."*
The engineering problem: ask a model to evaluate an idea and it scores 80.
Ask it about a genuinely bad idea and it still scores 75. Three fixes that
worked — calibrating the prompt with an explicit distribution ("most ideas
score below 50"), casting it as a partner who funds 3 of 200 rather than an
assistant, and reconciling the model's own recommendation against its own
score band because models classify worse than they score. Plus the budget
detail: competitor analysis is skipped entirely for ideas that scored below
40, because there's no reason to spend frontier-tier money researching the
competition for something you just recommended killing. Ask: how do you stop
an LLM from agreeing with you?
