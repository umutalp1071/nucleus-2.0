# The hardest part wasn't generating posts. It was deciding what's worth posting.

The obvious build for a build-in-public engine is: diff the event log, hand it to a model, get a post. I built that first. It produced "venture moved to planned" as a headline. Technically true. Nobody cares.

**What I hit:** most build-in-public tooling generates from a raw activity feed, which surfaces whatever happened most recently, not whatever happened that's actually interesting. A rename and a killed venture look identical to a diff.

**What I tried first:** asking the AI to "pick the interesting parts" as part of the same generation call. It worked, sometimes, and failed silently the rest of the time -- there was no way to test "did it pick the right story" without reading every output by hand.

**What worked:** a separate, pure scoring function with zero AI calls. `selectStory()` weights a killed verdict and a Prediction resolved `missed` at the top, a stage transition or a fired budget guard in the middle, and routine CRUD at zero. The AI only ever sees what already survived the filter.

```ts
function scoreEvent(event: NucleusEvent): number {
  if (event.type === "venture.advanced") {
    return (event.payload as { to?: string })?.to === "killed" ? 100 : 70;
  }
  if (event.type === "budget.blocked" || event.type === "venture.deployed") return 70;
  return 0; // routine CRUD
}
```

**Why this way:** the selection is the editorial judgment, and editorial judgment is exactly the kind of logic that degrades silently if it isn't tested. A weighted sum is one file, testable in milliseconds, and costs nothing to run on every generation.

**What it costs:** the weights are hand-picked, not learned -- if a founder's actual audience cares about something this table doesn't rank highly, nobody finds out until they read a boring draft and reject it.

What's your signal for "this is worth telling someone about," and did you write it down or is it still just a feeling?

#buildinpublic #nucleus2 #typescript

---

## Visual

**Type:** Terminal screenshot

Run `npx vitest run tests/selectStory.test.ts` and capture the output showing the "a killed verdict outranks a routine event" and "routine CRUD scores zero" tests passing.
