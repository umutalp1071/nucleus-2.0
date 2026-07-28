# PEERLIST BUILD-IN-PUBLIC PLAYBOOK

Every phase ships two posts. They are a Definition-of-Done gate, not a bonus.

The goal is not "posting about the project." The goal is: **a developer
scrolling Peerlist stops, reads to the end, and remembers the author's name.**

---

## Why this is a hard requirement

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

## The two posts per phase

### Post A — SHIP: "here's what now works"

File: `docs/content/drafts/YYYY-MM-DD-phase-NN-ship.md`

Concrete, visual, demoable. What can a person *do* today that they couldn't
yesterday.

### Post B — LESSON: "here's a problem I hit and how I solved it"

File: `docs/content/drafts/YYYY-MM-DD-phase-NN-lesson.md`

The engineering decision. This is the one that earns respect and follows.
Developers don't follow ship logs; they follow people who think clearly in
public.

The founder supplies screenshots and hits publish. Everything else is written.

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

---

## Angles already assigned per phase

Each `PHASE-NN` file ends with its two angles pre-chosen. Use them — they were
selected so the series has narrative arc rather than 26 disconnected updates.
The arc across all phases is:

> *"One person, an AI, and a $50/month cap tried to build a venture studio.
> Here is every decision, including the wrong ones."*

Deviate from an assigned angle only if something genuinely more interesting
happened during the phase. Something going wrong always qualifies.
