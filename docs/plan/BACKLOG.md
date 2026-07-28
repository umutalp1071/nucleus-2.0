# BACKLOG

Where good ideas go so they don't become scope creep.

**Rule:** if it's not in the current phase's scope, it goes here. Adding a row
takes ten seconds and protects the plan. Nothing is ever "quickly also done."

---

## Deferred with a known trigger

| Item | Why deferred | Build it when |
|---|---|---|
| Supabase / Postgres backend | JSON files fit a single operator; Supabase needs an account the agent can't create | Multi-user arrives, or a collection passes ~10k rows |
| Auth + row-level security | One user | Someone other than the founder needs their own instance-hosted account |
| Real code generation | Competing with VC-funded builders on $50/month, solo | The copilot loop has real users and codegen is the top request |
| Live market data (web search) for validation | A whole subsystem; the model's training knowledge is the honest v1 | Verdict quality is demonstrably limited by stale knowledge |
| Auto-posting to Peerlist / X / LinkedIn | OAuth per platform, and unreviewed posting is a bad idea anyway | The drafts inbox is being used weekly and copy-paste is the bottleneck |
| Analytics integration (Plausible / GA / Stripe) | Manual weekly entry takes 11 seconds | A user complains about typing it |
| Landing page template variants | One excellent template beats five mediocre ones | Two users say pages look identical |
| Background job queue | No AI task exceeds ~30s inline | One does |
| Streaming AI responses | Perceived-speed polish, real complexity in the gateway | Validation regularly exceeds 15s |
| Cost optimisation suggestions | Needs usage history to be non-obvious | 3+ months of ledger data exists |
| Plugin system / marketplace | Phase 4 of the old MASTER_PLAN. No users yet | There are users and a second developer |
| White-label / enterprise | Same | Same, plus revenue |
| Idea → multiple venture comparison | Interesting, unproven need | A user runs 5+ ventures at once |
| Custom domains for launch pages | Vercel handles the subdomain fine | Someone asks |

---

## Rejected outright, with reasoning

Recorded so nobody re-proposes them.

| Item | Why not |
|---|---|
| A state management library | Server components + route handlers + `useState`. Prop depth never exceeds 2. |
| A component library | The four primitives in `ui.tsx` cover the whole app. Radix only if a correct focus trap proves to be >40 lines (Phase 12 decides). |
| An ORM | JSON files with a version field. |
| The OpenAI SDK | OpenRouter is OpenAI-compatible REST. One `fetch`. |
| Encrypting the stored API key | The decryption key would live beside it. Security theatre is worse than honest plaintext in a gitignored local file. See Phase 05. |
| Letting the model emit raw HTML | Unvalidatable, inconsistent, XSS surface, breaks a11y. Structured copy + a hand-built template instead. See Phase 08. |
| Sentry / external error tracking | Local-first single-operator app. Nowhere to send telemetry, and it shouldn't. |
| Batch-generating all 12 content drafts | 12× cost for content mostly unused. Generate on click. |
| An AI call to expand milestones into tasks | The plan already has the content. Paying a model to reformat your own data is the waste the budget guard exists to prevent. |

---

## From the original docs

- `docs/NEXT_FEATURES.md` (idea export) — **absorbed into Phase 04.** The file
  can be deleted once Phase 04 ships.
- `docs/MASTER_PLAN.md` Phases 2–4 — superseded by this plan for scope. The
  ambition is retained; the timeline was fiction. Phase 2 "Growth" maps to
  Phases 09–10 here. Phases 3–4 are the rows above.
