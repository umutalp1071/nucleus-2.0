// Mock-provider fixtures, keyed by task name. Every entry must satisfy its
// task's zod schema — tests/gateway.test.ts iterates the registry and
// asserts exactly that, so a drifted fixture fails loudly instead of
// silently passing a broken demo mode.
export const FIXTURES: Record<string, unknown> = {
  "echo-check": { echo: "mock-echo" },

  // Deliberately negative -- demoing the kill path is the point. See
  // docs/plan/PHASE-03-real-validation.md.
  "validate-idea": {
    score: 34,
    recommendation: "kill",
    headline: "A crowded market with no clear wedge and thin willingness to pay.",
    marketSize: {
      estimate: "$50M-$200M niche, fragmented across many small players",
      confidence: "low",
      reasoning: "No public data specific to this niche; estimate extrapolated from adjacent categories.",
    },
    audience: {
      who: "Early adopters mildly annoyed by the status quo, not desperate for a fix",
      painLevel: "nice-to-have",
    },
    risks: [
      { risk: "At least four well-funded competitors already serve this exact use case", severity: "high" },
      { risk: "No obvious viral or word-of-mouth loop to acquire users cheaply", severity: "medium" },
      { risk: "Unclear who actually pays -- the beneficiary and the buyer may be different people", severity: "high" },
    ],
    moat: "None identified. The core mechanism could be rebuilt by a competent team in a weekend.",
    cheapestTest: "A single landing page with a waitlist form, promoted in two relevant communities for a week, before writing any product code.",
    whyNot: "The market is already served by incumbents with more data, more trust, and lower acquisition costs. Without a genuinely new distribution channel or a 10x wedge, this becomes a slow, expensive fight for scraps.",
  },

  "analyze-competitors": {
    competitors: [
      {
        name: "Incumbent A",
        whatTheyDo: "The dominant player with the largest install base in this category.",
        weakness: "Slow to ship, legacy UX, high price for smaller customers.",
        howYouWin: "Undercut on price and ship a faster, more focused product for the segment they ignore.",
      },
      {
        name: "Incumbent B",
        whatTheyDo: "A well-funded challenger targeting the same audience with a broader feature set.",
        weakness: "Feature bloat makes onboarding slow and confusing.",
        howYouWin: "Win on simplicity -- do one thing extremely well instead of everything adequately.",
      },
      {
        name: "Incumbent C",
        whatTheyDo: "A scrappy indie alternative with a small but loyal following.",
        weakness: "Limited resources mean slow feature velocity and thin support.",
        howYouWin: "Match their focus but out-execute on polish and reliability.",
      },
    ],
    differentiationVerdict: "The wedge is thin -- most of the obvious angles are already taken by at least one player, and none of the gaps look large enough to build a durable business around without a genuinely new distribution channel.",
    crowdedness: "high",
  },
};
