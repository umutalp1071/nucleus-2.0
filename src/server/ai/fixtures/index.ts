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

  "write-landing-page": {
    headline: "Stop filing things by hand. Let them file themselves.",
    subhead: "A single capture flow that organizes what you save automatically, so nothing gets lost in a spreadsheet again.",
    problem: "Anything worth saving today ends up scattered across notes apps, bookmarks, and screenshots, and manually filing it is the first thing to get skipped.",
    solution: "Capture one item in under 10 seconds and it sorts itself into the right place automatically -- no tags, no folders, no manual filing step.",
    benefits: [
      { title: "10-second capture", body: "One field, one button. Nothing to configure before you save your first item." },
      { title: "Auto-organized", body: "Every item is grouped by what it shares with your existing items -- no manual tagging, ever." },
      { title: "Built for individuals", body: "Priced and designed for one person's workflow, not a team's admin overhead." },
    ],
    socialProofPlaceholder: "Add 2-3 logos or quotes from early users once the first cohort is onboarded.",
    cta: { label: "Get early access", subtext: "No credit card. Takes 10 seconds to try." },
    faq: [
      { q: "How is this different from a spreadsheet?", a: "A spreadsheet requires you to manually organize every row. This organizes new items for you the moment you save them." },
      { q: "Do I need to tag or categorize anything?", a: "No -- the organization happens automatically based on your existing items, not manual rules you have to maintain." },
      { q: "Is my data private?", a: "Yes. Your captured items are visible only to you." },
      { q: "What does it cost?", a: "Pricing is being finalized during early access -- join now to lock in the early rate." },
    ],
    seo: {
      title: "Capture and auto-organize -- stop filing things by hand",
      description: "A single capture flow that organizes what you save automatically. No tags, no folders, no manual filing. Join early access.",
    },
  },

  "write-content-calendar": {
    strategy: "Show, don't pitch -- every post demonstrates the capture-to-organized loop in public, on the exact channels where this ICP already hangs out, so credibility is earned before any ask.",
    channels: [
      { channel: "r/productivity", why: "Highest concentration of people actively frustrated with manual filing systems.", cadence: "2x/week" },
      { channel: "the Indie Hackers forum", why: "Founders here reward build-in-public honesty over polish.", cadence: "1x/week" },
      { channel: "a niche Discord for this exact workflow", why: "Smallest, most qualified audience -- direct feedback loop.", cadence: "1x/week" },
    ],
    posts: [
      { day: 1, channel: "the Indie Hackers forum", angle: "Why I'm building this", hook: "I've filed the same screenshot into 4 different folders this month. So I stopped.", type: "story" },
      { day: 3, channel: "r/productivity", angle: "Teardown of manual filing habits", hook: "I tracked every time I manually organized something for a week. It was worse than I thought.", type: "teardown" },
      { day: 5, channel: "a niche Discord for this exact workflow", angle: "Early build update", hook: "Capture-to-organized is live end to end as of today. Rough edges everywhere, but it works.", type: "build-log" },
      { day: 7, channel: "r/productivity", angle: "Ask the audience", hook: "What's the one thing you always mean to file and never do?", type: "question" },
      { day: 9, channel: "the Indie Hackers forum", angle: "First real result", hook: "First user hit inbox zero on captured items without touching a single tag.", type: "result" },
      { day: 11, channel: "a niche Discord for this exact workflow", angle: "Design decision explained", hook: "I killed the folders feature before launch. Here's why.", type: "story" },
      { day: 13, channel: "r/productivity", angle: "Before/after", hook: "Same 20 items, two ways: manually filed vs. auto-organized. Screenshots inside.", type: "teardown" },
      { day: 15, channel: "the Indie Hackers forum", angle: "Build update", hook: "Auto-organization accuracy is now good enough that I stopped manually correcting it.", type: "build-log" },
      { day: 17, channel: "a niche Discord for this exact workflow", angle: "Ask for beta testers", hook: "Looking for 5 people who hoard screenshots to break this before anyone else does.", type: "question" },
      { day: 20, channel: "r/productivity", angle: "Retention result", hook: "5 of the first 10 users came back on day 2 without a reminder. Small number, real signal.", type: "result" },
      { day: 23, channel: "the Indie Hackers forum", angle: "What I'd do differently", hook: "If I started over, I'd cut the mobile app idea from day one instead of week three.", type: "story" },
      { day: 26, channel: "a niche Discord for this exact workflow", angle: "Launch announcement", hook: "It's live. No folders, no tags -- you'll see what I mean in ten seconds.", type: "result" },
    ],
  },

  "write-post": {
    draft: "I've filed the same screenshot into 4 different folders this month. So I stopped.\n\nEvery \"organization system\" I've tried puts the filing work on me, right when I'm least willing to do it -- the moment I'm trying to save something and move on.\n\nSo the tool I'm building does the filing itself. You save one thing in under 10 seconds, and it lands in the right place automatically, based on what you've already saved.\n\nStill rough. But the core loop works, and that's the only part that matters right now.",
  },

  "weekly-review": {
    whatMoved: "Signups grew from 8 to 14 this week, and the r/productivity post drove the majority of the new visits.",
    whatDidnt: "The Indie Hackers post got almost no engagement -- the build-log angle didn't land there this week.",
    recommendedAction: "Double down on r/productivity with a teardown-style post next week; hold off on another Indie Hackers post until there's a sharper result to share.",
    killCriteriaCheck: "Kill criteria was fewer than 5 of the first 25 signups returning in week 2 -- currently 6 of 14 have returned, so this is still on track, not a kill signal yet.",
  },
};
