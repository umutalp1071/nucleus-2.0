# My AI's "kill this idea" verdict is wrong 87% of the time

Nucleus's whole pitch is that it will tell a founder to kill their idea, honestly, before they waste a year on it. I had never once checked whether that verdict was any good.

**What I hit:** every edit I'd ever made to the validation prompt was unverifiable. I'd read the new prose, nod, ship it. No way to know if a change made the judgment better or worse.

**What I tried first:** waiting for real users and real resolved outcomes before measuring anything. Rejected -- that argument justifies a *better future version* of this report, not shipping the "kill" claim unmeasured in the meantime.

**What worked:** an eval harness. 34 historical startup ideas with known outcomes -- famous false negatives investors passed on, obvious duds, ambiguous middle cases -- run through the real model three times each, scored on calibration, kill precision, false kill rate, and stability.

```ts
function reconcileVerdict(verdict: Verdict): Verdict {
  const band = verdict.score < 40 ? "kill" : verdict.score < 70 ? "refine" : "build";
  if (verdict.recommendation === band) return verdict;
  return { ...verdict, recommendation: band };
}
```

**Why this way:** the score is the source of truth, not the model's own self-reported label -- and all three metrics get reported together on purpose, because no two of them can be gamed at once. A validator that never kills anything looks great on false kill rate and terrible on calibration.

**What it costs:** the real numbers. Stability is good -- the harness itself can be trusted. But false kill rate is 87%: of the ideas that actually succeeded, Nucleus would have killed nearly all of them. Calibration is undefined -- across 102 real calls, nothing ever scored 70+. It's currently closer to a reflexive skeptic than a discriminating judge, and I'm publishing that before I've fixed it.

Would you trust an AI's "kill this" if you'd never seen its actual track record against real outcomes?

#buildinpublic #nucleus2 #ai

---

## Visual

**Prepared 2026-07-31:** `images/2026-07-31-phase-13-lesson.png` — a real screenshot of the calibration report as it renders on GitHub right now (the repo is public), proving this isn't a cherry-picked local file.

**Type:** Screenshot (GitHub)

Screenshot `docs/eval/calibration-report.md` rendered on github.com/umutalp1071/nucleus-2.0 -- frame the summary table (calibration / kill precision / false kill rate / stability) so the real numbers are legible.
