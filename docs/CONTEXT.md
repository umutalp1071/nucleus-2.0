# NUCLEUS 2.0 — CONTEXT TRANSFER
## Last Updated: 2026-07-25
## Next Session: 2026-07-26 (Phase 1: MVP Start)

---

## 1. VISION (One Sentence)
"Everyone should have their own AI venture studio — running on their own computer, under their own control, without requiring technical knowledge, with a $50/month budget."

## 2. DIFFERENTIATION (What Separates It From Competitors)

| Competitor Type | What They Do | What Nucleus 2.0 Does |
|---|---|---|
| App Builders (Emergent, Lovable) | Only build apps | Builds BUSINESSES (growth, marketing, revenue) |
| Venture Studios (Atomic, Forum) | Take 25-50% equity | 0% equity, you stay in control |
| Agent Orchestrators (n8n, Make) | Require technical knowledge | Requires no technical knowledge |
| Personal AI OS | Individual productivity | Entrepreneurial capability |

## 3. CHARACTER (8 Principles — Code + UX + Communication)

1. **Jazz 🎷** — Creative, improvisational, creates unexpected connections.
2. **Zen 🌸** — Simple, deep, follows "less is more", leaves room for clarity.
3. **Ant 🐜** — Modular, uses stigmergy (indirect coordination), efficient.
4. **Immune System 🛡️** — Self-healing, "self/non-self" distinction, adaptive.
5. **Story 📖** — Turns numbers into stories, communicates more with fewer words (haiku).
6. **Friend 🎁** — Helps without expecting anything in return, never makes users feel indebted.
7. **Athlete 🏃** — Iterative, uses periodization (work-rest cycles), builds momentum.
8. **Beginner 🌱** — Learns every day, is not afraid to say "I don't know."

## 4. TECHNICAL ARCHITECTURE (5 Layers)

| Layer | Technology | Cost |
|---|---|---|
| 1. UI | Next.js 14 + Tailwind + shadcn/ui, Vercel | $0 |
| 2. AI Orchestrator | OpenRouter API (Llama 3.1, Mistral, Claude, Gemini) | ~$15-25/month |
| 3. Business Engine | Next.js API Routes + Edge Functions | $0 |
| 4. Data | Supabase (500MB, 2M requests) | $0 |
| 5. Deployment | Vercel API, GitHub API, Cloudflare R2, Stripe test | $0 |

## 5. ROADMAP

- **Phase 1 (Now — 2-4 weeks):** Dashboard, Idea Input + Analysis, Basic Code Generation, Vercel Deployment, Budget Tracking
- **Phase 2 (1-2 months):** Market Intelligence, Auto-SEO, Growth Engine, Opportunity Radar
- **Phase 3 (2-3 months):** Self-improvement, Multi-project Support, Revenue Optimization
- **Phase 4 (3-6 months):** Installable Version, Plugins, API Marketplace, White-label

## 6. CRITICAL DECISIONS (Lessons From Nucleus 1.0)

- No obsession with "perfect code." Follow the **"good enough" principle**.
- **Marketing = development** in importance. They run in parallel, marketing is not postponed until the end.
- **Pre-launch hype starts from day one.** No "I'll promote it when it's finished."
- There is a **$50/month budget limit** that cannot be exceeded. Daily limit: $10, weekly limit: $30.
- Every agent works within a defined **"permission boundary"**. No overly broad authority.
- The user **does not see technical details.** Follow the principle of "freedom from needing to know."
- **Prompts are generated from standard templates** and version-controlled. No inconsistent prompts.
- Every error is **logged** and recurrence is prevented. An error database is mandatory.
- **The vision is reviewed every 2 weeks.** Getting stuck on small SaaS projects is forbidden.

## 7. CURRENT STATUS

- 3 strategic analysis documents completed (Market, Serendipity, Extended Strategy).
- Graphify setup planned (`uv tool install graphifyy`).
- Marketing Engine MVP planned (GitHub Actions + OpenRouter).
- Quality Agent prompt template prepared.
- Budget Agent and Early Warning System designs prepared.
- Pre-launch timeline (3 months) prepared.

## 8. TOMORROW'S GOAL (2026-07-26)

**Phase 1, Day 1:**

1. Set up the project infrastructure (Next.js 14, Tailwind, shadcn/ui).
2. Create the basic dashboard UI.
3. Design the "New Idea" button and idea input flow.
4. Install Graphify and run it on the codebase.
5. Prepare and publish the first "Build in Public" post.

## 9. WORKING PRINCIPLES (With Claude)

- **Read this file before every session.**
- **5-5-10-5-5 minute rule:** Plan (5) → Discuss (5) → Implement (10) → Review (5) → Refine (5).
- Every output must be **"actionable"**, not theoretical.
- Code quality score must be >70. Quality Agent review is mandatory.
- At the end of every session:
  **"What did we learn in this session, and what should we record?"**

  ---

## PUSH RULES (For Claude)

- Automatically push after every commit. Do not wait for separate approval.
- Always consider `git push` safe.
- If there is a push error (conflict, etc.), then ask me.