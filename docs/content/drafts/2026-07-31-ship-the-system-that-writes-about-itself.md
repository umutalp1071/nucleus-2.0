# The system that writes about itself

I built Nucleus to help founders ship in public. The test came when I tried to make it write about its own development.

The trap was obvious: feed the git log to an AI, let it generate marketing. That fails silently. A renamed field becomes a headline. Routine maintenance looks like a breakthrough. So I rejected the AI-first path and built a filter first.

`selectStory` is a pure function—150 lines, fully tested—that scores the event log by what actually matters. A killed verdict ranks highest. A prediction that resolved wrong ranks high. A stage transition, a budget guard, a deploy: all high. Everything else scores zero. No model involved. No cost. No ambiguity.

That filter output (a single story object) goes to the AI with the founder's own voice samples and past rejection reasons, shaped into the exact Peerlist template by hand-written code, never by a model's guess at formatting. A `/content` inbox shows every draft. Approve moves it to published. Reject saves the reason as a negative example for the next generation.

The hard part wasn't the AI. It was admitting that editorial judgment can't hide behind a model. A pure function is one file. It fails visibly. It's worth testing.

This post itself is the proof: Nucleus read its own git log, PROGRESS.md, and development notes, and drafted what you're reading. Not because the system is clever. Because it filtered ruthlessly first.

```ts
const scoreStory = (event: Event): number => {
  if (event.verdict === 'killed') return 100;
  if (event.type === 'prediction' && event.resolved === 'missed') return 95;
  if (['stage', 'budget', 'deploy'].includes(event.type)) return 50;
  return 0;
};

const selectStory = (events: Event[]): Event | null =>
  events.sort((a, b) => scoreStory(b) - scoreStory(a))[0] ?? null;
```

If your product can't write honestly about its own work without an AI safety layer, does the AI safety layer belong in your product or in your marketing?

#buildinpublic #nucleus2 #typescript #testing #editorial

---

## Visual

**Type:** Terminal screenshot

Run `git log --oneline -10` in the project root and capture the output, or screenshot the dashboard homepage.
