# PHASE 10 — BUILD-IN-PUBLIC ENGINE

**Goal:** the event log becomes publishable content, automatically — for the
user's ventures and for Nucleus itself.

**Why now:** the event log has been accumulating since Phase 01 and is
currently used only for an activity feed. This phase closes the loop the
lessons file demands: *"Nucleus should not only build software. Nucleus should
document how software is built."*

And it is the dogfooding moment — Nucleus starts writing Nucleus's own posts.

---

## Scope

**In:** `write-buildinpublic` task, event → narrative selection, a drafts
inbox, voice calibration, self-documentation mode.

**Out of scope:** auto-posting to Peerlist/X/LinkedIn (Backlog — OAuth per
platform, and posting without review is a bad idea regardless). Scheduling.
Engagement analytics.

---

## Steps

### 1. Event selection

Not every event is a story. `src/server/content/selectStory.ts` — a pure
function, no AI — scores recent events for narrative value:

| Signal | Weight |
|---|---|
| A `Prediction` resolved `missed` | **highest** — see below |
| A `killed` verdict | **highest** — the most shareable thing the system does |
| A stage transition | high |
| Budget guard fired | high — it's a genuinely interesting engineering story |
| A deploy went live | high |
| Something failed and recovered | high |
| Routine CRUD | zero |

> **Extended by `docs/reviews/2026-07-30-stack-position.md` §8, adopted.**
> Phase 08.5 added `Prediction` and `Observation`; a prediction resolved
> `missed` is now available as input to this function and ranks alongside a
> `killed` verdict. "We predicted 50 signups, we got 6, here is what we got
> wrong" is the most shareable content type that exists — the same insight
> that already made `killed` a first-class stage, now with real data behind
> it instead of just a verdict. This scoring table was designed for this
> signal from day one; it simply had no data to score before Phase 08.5.

Returns the top-N storyworthy events in a window. Pure function → easy to
test, and it costs nothing to run.

**TDD this.** It encodes an editorial judgement, which is exactly the kind of
thing that silently degrades.

### 2. `write-buildinpublic` task

Tier `mid`. Input: selected events + venture context + a voice sample.

```ts
const PostSchema = z.object({
  kind: z.enum(["ship","lesson"]),
  title: z.string().max(80),
  body: z.string(),                   // markdown, 150-300 words
  codeBlock: z.string().nullable(),
  question: z.string(),               // the closing ask
  tags: z.array(z.string()).min(2).max(4),
});
```

The prompt embeds `docs/plan/PEERLIST-PLAYBOOK.md`'s rules — open on tension,
name the rejected alternative, one hard number, one code block, end on a
specific question, 150–300 words, no "excited to announce."

### 3. Voice calibration

Feed 2–3 approved posts from `docs/content/drafts/` as style examples. Store
the chosen samples in settings so the user can curate their own voice.

This is what separates it from every "AI social media generator": the voice
comes from the founder's own already-published writing, not from a tone slider.

### 4. Drafts inbox — `/content`

- generated drafts, newest first
- edit in place
- approve → moves to `docs/content/published/` with a date stamp
- reject with a one-line reason, fed back into the next generation as a
  negative example
- copy-to-clipboard, formatted for Peerlist

The reject-reason loop is the cheapest possible learning mechanism and needs
no ML — just a growing list of "don't do this" in the prompt.

### 5. Self-documentation mode

The one that closes the loop. Nucleus reads **its own** development events:

- git commits since the last generated post (`git log --oneline`)
- `docs/plan/PROGRESS.md` phase completions
- `docs/workflow/learning.md` entries

and generates build-in-public posts about Nucleus's own development.

At this point Nucleus is writing the marketing for Nucleus, which is both the
best possible demo and a genuinely useful tool for the founder. Say so
prominently in the post — it is the strongest proof the product works.

`ponytail: reads git log via child_process, no git library. One command,
parsed with split().`

### 6. Migrate the existing protocol

`docs/workflow/PROTOCOL.md` §4 describes manual draft creation at session end.
Replace with: generate through Nucleus, review in the inbox. Update
`PROTOCOL.md` to say so.

The templates in `docs/content/templates/` are superseded by
`PEERLIST-PLAYBOOK.md`. Delete them.

---

## Acceptance

```bash
npm run verify
```

- `tests/selectStory.test.ts`: a `killed` verdict outranks a rename; routine
  CRUD scores zero; empty window returns empty
- Generated post satisfies the schema and the playbook's word count
- Approve → file lands in `docs/content/published/`
- Reject reason appears in the next generation's prompt (assert on the
  rendered prompt string)
- **Self-documentation mode generates a post about this very phase.** Read it.
  If it isn't good enough to publish, fix the prompt, not the post.
- Browser-verified, screenshots read

---

## Risks

| Risk | Mitigation |
|---|---|
| Posts read like generic AI slop | Voice samples from real writing; playbook rules in the prompt; reject-reason feedback; the founder always reviews |
| Auto-posting something wrong | There is no auto-posting. Human approval is mandatory by design |
| Cost per post at 3/week | `mid` tier, ~$0.01/post, ~$0.15/month. Rounding error against the cap |
| Self-documentation gets recursive/navel-gazing | Selection function weights *shipped capability* over *process*; the reader wants the system, not the meta |

---

## Peerlist posts

**A — SHIP:** *"This post was written by the product it's about."*
The dogfooding reveal, and the strongest single demo in the series. Nucleus
reads its own git log, its own event stream, its own phase completions, and
drafts the build-in-public post. Show the raw generated draft next to the
published version so people can see exactly how much editing it needed — being
honest about the delta is what makes it credible rather than a stunt.

**B — LESSON:** *"The hardest part wasn't generating posts. It was deciding
what's worth posting."*
The selection function. Most build-in-public tooling generates from a diff,
which produces "refactored the user service" — technically true, nobody cares.
The fix was a pure scoring function over the event log where a killed venture
outranks ten commits, because the interesting story is always the decision,
not the code. No AI in that function at all — it's a weighted sum, it's
testable, and it costs nothing. Ask: what's your signal for "this is worth
telling someone about"?
