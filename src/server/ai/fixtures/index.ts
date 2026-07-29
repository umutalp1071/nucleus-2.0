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

  "plan-venture": {
    positioning: {
      oneLiner: "A focused alternative for the one segment incumbents ignore.",
      category: "Niche productivity tooling",
      wedge: "Serve the smallest, most underserved segment of the market first, not everyone at once.",
    },
    icp: {
      who: "Early adopters already frustrated with the incumbent's complexity",
      where: ["r/productivity", "the Indie Hackers forum", "a niche Discord for this exact workflow"],
      currentSolution: "A spreadsheet, or an incumbent tool used for 10% of its features",
      switchTrigger: "Hitting a specific, repeated friction point the incumbent has ignored for years",
    },
    differentiation: [
      "Radically simpler onboarding than any incumbent",
      "Priced for individuals, not teams",
    ],
    firstTenUsers: "Post the working demo directly in the two communities above and personally onboard the first 10 replies.",
    successMetric: { metric: "Weekly active users", target: "25", by: "6 weeks after launch" },
    killCriteria: "If fewer than 5 of the first 25 signups return in week 2, the retention hypothesis is wrong -- stop before building further.",
  },

  "scope-mvp": {
    coreLoop: "User captures one item, sees it organized automatically, and comes back the next day to add another.",
    mustHave: [
      { feature: "Single capture flow", why: "The entire value proposition depends on this being frictionless" },
      { feature: "Automatic organization", why: "The differentiator versus a plain spreadsheet" },
    ],
    explicitlyNot: [
      "Team collaboration -- v1 is single-player only",
      "Mobile app -- web-only until there's proof anyone wants this",
      "Integrations with other tools -- adds surface area before the core loop is proven",
    ],
    milestones: [
      { name: "Capture flow", outcome: "A user can add an item in under 10 seconds", estimateDays: 3 },
      { name: "Auto-organization", outcome: "Captured items sort themselves with no manual tagging", estimateDays: 5 },
      { name: "First 10 users onboarded", outcome: "10 real people using it daily, not just signed up", estimateDays: 7 },
    ],
    stack: {
      recommendation: "Next.js + a hosted Postgres, deployed to Vercel",
      reasoning: "Fastest path to a working product for one operator; matches Nucleus's own stack so there's nothing new to learn.",
    },
    riskiestAssumption: "That the organization step actually saves people time versus doing it manually -- unproven until real users try it.",
  },

  "generate-build-spec": {
    summary: "A single-player capture tool that automatically organizes what you save, so you never have to manually file anything again.",
    userStories: [
      {
        as: "a returning user",
        iWant: "to capture a new item in under 10 seconds",
        soThat: "the friction of saving something never stops me from doing it",
        acceptance: [
          "A capture form is reachable within one click/tap from any screen",
          "Submitting the form returns the user to a ready-to-capture state, not a dead end",
        ],
      },
      {
        as: "a user with several captured items",
        iWant: "them organized automatically",
        soThat: "I never have to manually tag or file anything",
        acceptance: [
          "Each new item is assigned to the category whose existing items share the most keywords with it -- no manual tagging step",
          "Reloading the page preserves the organization",
        ],
      },
      {
        as: "a first-time visitor",
        iWant: "to understand what the product does within a few seconds",
        soThat: "I decide whether to try it instead of bouncing",
        acceptance: ["The landing view names the core loop in one sentence, above the fold"],
      },
    ],
    dataModel: [
      { entity: "User", fields: ["id", "email", "createdAt"] },
      { entity: "Item", fields: ["id", "userId", "content", "category", "createdAt"] },
    ],
    screens: [
      { name: "Sign in", purpose: "Authenticate a returning user", elements: ["email field", "magic link button"] },
      { name: "Capture", purpose: "Add a new item in one step", elements: ["input field", "submit button"] },
      { name: "Organized view", purpose: "See everything captured, auto-grouped", elements: ["grouped list", "empty state"] },
    ],
    outOfScope: [
      "Team collaboration -- v1 is single-player only",
      "Mobile app -- web-only until there's proof anyone wants this",
      "Integrations with other tools -- adds surface area before the core loop is proven",
    ],
    firstCommit: "Set up the data model (User, Item) and a single capture form that writes an Item.",
  },
};
