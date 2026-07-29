# The best feature I shipped this week makes zero AI calls

**Publish date:** 2026-08-12

Turning a scope's milestones into a checklist looked like an obvious job for the model. It isn't, and proving that took exactly one assertion: the provider was called zero times.

**What I hit:** advancing a venture from `planned` to `building` needs to turn its 3-6 MVP milestones into a checkable build task list.

**What I tried first:** my first instinct was to prompt a model to break each milestone into finer sub-tasks -- it felt more helpful, more "AI-native."

**What worked:** the milestone objects already contain everything a task needs. A task *is* a milestone's outcome, grouped under its name.

```ts
const tasks = mvpScope.milestones.map((m) => ({
  milestone: m.name,
  title: m.outcome,
}));
```

Zero calls, zero latency, zero chance of "invalid output" or "budget exceeded" -- failure modes I'd already built retries for, and none of which apply to a `.map()`.

**Why this way:** paying a model to reformat data that's already sitting on disk, validated by zod, is exactly the tax the $50/month budget guard exists to prevent. On that budget you develop a reflex for asking "does this need a model at all?" -- and the honest answer is no, more often than the AI-first framing suggests.

**What it costs:** the task list is only as granular as the milestones -- 3 to 6 tasks, not 20. Anyone wanting a finer checklist is subdividing by hand for now. Naming that so it reads as a tradeoff, not an oversight.

What did you almost hand to an LLM before realizing a `.map()` already did the job?

#buildinpublic #nucleus2 #typescript

---

## Visual

**Type:** Terminal screenshot

Run `npx vitest run tests/startBuilding.test.ts` and screenshot the passing output. The interesting line is the assertion in the test body: `expect(runTaskSpy).not.toHaveBeenCalled()` -- crop or highlight it if the terminal screenshot tool allows annotation.
