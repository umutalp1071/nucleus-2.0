# PEERLIST BUILD-IN-PUBLIC PLAYBOOK

> **Status: the per-phase gate is FROZEN as of 2026-07-31.** The craft rules
> below still stand and should be followed by anything that does get written.
> What is suspended is the *requirement* to produce a post per phase. Read
> "Why this gate is frozen" immediately below before writing any new post.

The goal is not "posting about the project." The goal is: **a developer
scrolling Peerlist stops, reads to the end, and remembers the author's name.**

---

## Why this gate is frozen

The count, on the day this was written: **24 drafts written, 4 published.**
The four published are Phase 00. Writing was never the bottleneck — a
six-post backlog per published post is not an output problem, it is an
inventory problem, and the gate was making it worse on every phase.

Three specific defects, in increasing order of how much they matter.

**1. It is an open loop.** `PHASE-10` puts engagement analytics explicitly
out of scope, so the system emits posts and never observes what happened to
them. This is precisely the defect `docs/reviews/2026-07-30-stack-position.md`
§3 diagnosed in the product — *"produces judgment, never observes outcomes,
adapts to nothing"* — and Phase 08.5 was inserted to fix it. The fix was
applied to ventures and not to the content subsystem, where it was worse: the
venture loop is at least bounded by the $50 cap, and the content loop is
bounded by nothing except founder hours.

**2. It ties content volume to a variable no reader cares about.** Making a
post a Definition-of-Done item means the only thing the content stream can
express is *how fast the code is going*. Nobody outside the project holds a
position in that variable.

**3. It builds the wrong credibility.** Posts about the gateway architecture
compound into "this person is a careful TypeScript engineer." That is a real
asset, and it is not the asset that makes a stranger trust a `kill` verdict
about their own business. The account being funded is not the account that
can be spent.

The uncomfortable part: this playbook is *good*, and that is why it lasted.
It converted an unbounded, rejection-heavy, uncontrollable activity into a
bounded, checklist-shaped one — word count, one code block, a pre-publish
checklist. It made marketing pass `npm run verify`. It achieved that by
removing the only part that could not be made deterministic, which is the
other person.

### What replaces it

Phase 13 (calibration), pulled ahead of Phase 11. A published number about
whether the product's central claim is true — see
`docs/eval/calibration-report.md` once `npm run eval` has been run. One
artifact that can be wrong in public beats twenty that cannot.

### What to do with the existing backlog

Publish it, oldest-first, unchanged. It is already written; the marginal cost
is zero and the marginal value is not. Do not write more to extend it.

### When to write a new post

When there is a **resolved prediction, a published number, or a specific
public claim that could have gone the other way** — not when a phase closes.
Everything below still governs *how* to write it.

---

## Why this was a hard requirement (historical — see the freeze above)

Nucleus 1.0 died invisible. Lessons #2, #3, #4, #11, #12 all diagnose the same
cause: the product was excellent and nobody knew. The correction is not "post
more later." It is that shipping and telling are the same action.

Concretely, these posts are meant to:

- build an audience while the product is still unfinished
- attract developers and early users before there is anything to sell
- make the development journey itself the public artifact
- establish the founder's name in the developer community

A post that gets no engagement still failed at all four. Write for the reader,
not for the changelog.

---

## Content is a queue, not a diary

An AI agent can finish several phases in one real day. Publishing one post a
day cannot keep up with that indefinitely — the backlog would grow without
bound, and by the time the product is finished the founder would still be
publishing about phases from weeks earlier. That defeats the actual goal
(build an audience *while* building), so two things change on purpose:

1. **Posts never claim same-day immediacy.** No "today," "yesterday," "this
   week." A post is a numbered field-note in an ongoing build log, read at
   whatever pace the founder publishes it — never a diary entry whose truth
   depends on publish date matching commit date.
2. **Publishing cadence is independent of dev cadence.** The founder publishes
   roughly one a day, oldest-unpublished-first, and skips or doubles up
   without consequence — there is no schedule to fall behind on. Volume is
   controlled at the writing end (see below), not by rationing publish dates.
3. **Free reach lever:** the same text, unedited, also goes to X and LinkedIn.
   Zero extra writing, more audience — always mention this when handing off a
   post.

---

## The posts per phase: one by default, two when earned

### Post A — SHIP: "here's what now works"

File: `docs/content/drafts/YYYY-MM-DD-phase-NN-ship.md`

Concrete, visual, demoable. What can a person *do* now that they couldn't
before.

### Post B — LESSON: "here's a problem I hit and how I solved it"

File: `docs/content/drafts/YYYY-MM-DD-phase-NN-lesson.md`

The engineering decision. This is the one that earns respect and follows.
Developers don't follow ship logs; they follow people who think clearly in
public.

**Default to writing one of these per phase** — whichever angle is genuinely
stronger for what that phase produced. Write both only when the phase clearly
earns it: a real visible/demoable capability *and* a real decision worth
arguing. Plumbing-heavy phases (schema, infra, a gateway) usually earn only
the Lesson; visually rich phases usually earn only the Ship. This is the
lever that keeps the content queue from outgrowing what one person can
publish — cut here, not by rationing publish dates.

The founder supplies screenshots and hits publish. Everything else is
written — including the shot list. Never leave it for a later session; a
post without one is not done.

---

## Visual instructions (required on every post)

Every post ships with a `## Visual` section appended at the very end, after
the hashtags, clearly separated by a `---` so it can never be mistaken for
part of the post text itself. It tells the founder exactly what to capture —
they should never have to decide this themselves.

Pick exactly one, in this order of preference:

1. **Screenshot of the live app** — when the feature has a real, current
   screen. Name the exact URL/route, the exact state the app must be in
   (e.g. "a venture at the `validated` stage," "demo mode with no key
   configured"), and what must be visible in frame.
2. **Screen recording** — when the *sequence* is the point (a multi-step
   flow, a before/after transition, a loading state resolving). Give the
   exact ordered steps to perform and an approximate duration (10–30s).
3. **Terminal/code screenshot** — when the feature is backend-only with no
   UI yet, or the post's claim is best proven by a test/output (e.g. "the
   provider was called zero times"). Give the exact command to run.
4. **AI-generated image** — only when nothing above applies (a pure
   architecture/concept post with no current UI and nothing provable in a
   terminal, e.g. a state-machine diagram). Write the full image prompt
   in the file, ready to paste into an image generator — don't just say
   "an image of X."

If the feature the post describes has since been superseded or deleted by a
later phase (this will keep happening as the product evolves), don't chase
the historical UI — say so explicitly and either point at the current
equivalent screen or fall back to a code/terminal screenshot of the
historical commit (`git log --follow -- <file>` to find it). Never leave a
post without a visual because the original screen no longer exists.

---

## No scheduled dates — order is the only signal

Posts do **not** carry a `**Publish date:**` line. A specific future calendar
date is a promise the queue can't keep once dev outpaces publishing, and
maintaining it is unnecessary bookkeeping for something the founder controls
anyway (see "Content is a queue, not a diary").

Ordering comes from the filename alone: `YYYY-MM-DD-phase-NN-{ship,lesson}.md`,
where the date is simply *when the post was written* (a record, like a git
commit date — never a scheduling promise). The founder publishes
oldest-unpublished-first. A post is marked published by appending `PAYLAŞTIM`
on its own line at the end of the file — never delete or renumber a published
post, it's a historical record.

(Drafts written before this rule changed may still carry a `**Publish
date:**` line with a far-future date — it's vestigial. Ignore it; publish in
filename order same as everything else.)

---

## The five things every post must contain

The founder specified these. Every post covers all five, though not as
labeled headings — weave them into prose:

1. **Current state of the system** — what exists right now
2. **The problems that were solved** — named specifically, not "improved things"
3. **How they were solved** — the actual mechanism
4. **The engineering decisions behind it** — what you chose *and what you
   rejected*. The rejected option is what makes it interesting.
5. **The expected next state** — what comes next, so people return

---

## Rules that make the difference

**Open with tension, never with a label.**
- Dead: "Day 5 of building Nucleus 2.0. Today I implemented budget tracking."
- Alive: "My AI spending cap was a number on a dashboard. Which means by the
  time it turned red, the money was already gone."

**Name the thing you rejected.** "I used X" is a changelog. "I almost used X,
here's why Y won" is an argument, and arguments get replies. Replies are
distribution.

**Show the number.** 1,318 lines. 4 dependencies. $0.003 per validation.
0 external accounts required. Specifics are credible; adjectives are not.

**Include one real code block, 5–15 lines.** The type signature or the one
function that carries the idea. Never a full file dump.

**Be willing to look wrong.** "I built this backwards and here's the rewrite"
consistently outperforms "I built this perfectly." The bug you shipped is
better content than the feature you shipped.

**End with a question you actually want answered.** Not "what do you think?"
— something specific enough that a person has an opinion:
"Do you meter AI spend before the call or after? I've only ever seen after."

**Length: 150–300 words.** Cut every sentence that survives its own deletion.

**Voice:** first person, past tense, plain words. You are a builder telling
another builder what happened. No "excited to announce," no "🚀," no
"game-changing," no thread-bait numbering.

**Tags:** `#buildinpublic #nucleus2` plus one topical
(`#typescript`, `#ai`, `#nextjs`, `#llm`).

---

## Template — SHIP

```markdown
# [Concrete capability, not a phase number]

[One sentence: what a person can now do. No preamble.]

**Where it stands:** [current state of the system in 2-3 sentences —
what's real, what's still mock, honest about both]

**The problem:** [the specific thing that was broken or missing, and why
it mattered — not "needed improvement"]

**How it works now:** [the mechanism, concretely]

```ts
[5-15 lines: the signature or function carrying the idea]
```

**The call I made:** [decision + the option rejected + why]

**Next:** [what the next phase unlocks, one sentence]

[Specific question to the reader]

#buildinpublic #nucleus2 #[topical]

---

## Visual (production note — not part of the post)

**Type:** [Screenshot | Screen recording | Terminal screenshot | AI-generated image]

[Exact route/screen + state to put the app in, or exact command, or exact
recording steps, or the full image prompt.]
```

---

## Template — LESSON

```markdown
# [The insight as a claim, e.g. "A budget you check after the call isn't a budget"]

[Open on the tension. 2 sentences. No "while building X" throat-clearing.]

**What I hit:** [the problem, concretely, with the detail that makes it real]

**What I tried first:** [the obvious approach and exactly where it broke]

**What worked:** [the actual solution]

```ts
[the code that carries it]
```

**Why this way:** [the engineering reasoning — the tradeoff, named]

**What it costs:** [honest downside. Every real decision has one. Naming it
is what makes the post trustworthy.]

[Question]

#buildinpublic #nucleus2 #[topical]

---

## Visual (production note — not part of the post)

**Type:** [Screenshot | Screen recording | Terminal screenshot | AI-generated image]

[Exact route/screen + state to put the app in, or exact command, or exact
recording steps, or the full image prompt.]
```

---

## Pre-publish checklist

- [ ] Would this be worth reading if it weren't my project?
- [ ] Does it name a rejected alternative?
- [ ] Is there at least one hard number?
- [ ] Is there exactly one code block, and is it the interesting part?
- [ ] Does the ending invite a specific reply?
- [ ] Under 300 words?
- [ ] Zero words a non-native English speaker would need to look up?
- [ ] All five required elements present (state, problem, solution, decision,
      next)?
- [ ] Has a `## Visual` section naming exactly what to capture (screenshot /
      recording / terminal / AI-image), with a full prompt if AI-image?
- [ ] Zero "today"/"this week"/other language claiming same-day immediacy?
- [ ] If this phase produced two posts, does each genuinely earn its place
      (a real demo *and* a real decision), not just default habit?

---

## Angles already assigned per phase

Each `PHASE-NN` file ends with its two angles pre-chosen — a SHIP angle and a
LESSON angle. Treat them as a menu, not a mandate: pick whichever one is
genuinely stronger for what that phase produced (see "one by default, two
when earned" above), rather than always writing both. They were selected so
the series has a narrative arc rather than 26 disconnected updates. The arc
across all phases is:

> *"One person, an AI, and a $50/month cap tried to build a venture studio.
> Here is every decision, including the wrong ones."*

Deviate from an assigned angle only if something genuinely more interesting
happened during the phase. Something going wrong always qualifies.
