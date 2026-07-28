> ## ⚠️ SUPERSEDED FOR SCOPE — 2026-07-28
>
> **`docs/plan/` is now the authoritative implementation plan.** Read
> `docs/plan/PROGRESS.md` to find the current phase.
>
> This file is kept as historical record and for its rituals (daily / weekly /
> monthly cadence, checkpoints, risk table), which still apply. Its **feature
> timeline does not** — "Week 3: Idea → Code → MVP generation" and "Week 4:
> Deploy + Growth" were not achievable and their scope has been deliberately
> corrected. See `docs/plan/00-ANSWER.md` §2 for the reasoning, and
> `docs/plan/BACKLOG.md` for where Phases 2–4 of this document went.
>
> The ambition here was right. The timeline was fiction.

---

# NUCLEUS 2.0 — MASTER PLAN
## Daily / Weekly / Monthly Roadmap

---

## PHASE 0: PREPARATION (Completed — July 25, 2026)
- [x] Strategic analysis (3 documents)
- [x] Technical architecture decisions
- [x] Project infrastructure (Next.js 14 + Tailwind)
- [x] Graphify setup
- [x] Error database
- [x] Development protocol + prompt templates
- [x] Build in Public started (Peerlist)

---

# PHASE 1: MVP (2-4 weeks) — GOAL: Working Dashboard

## WEEK 1 (July 26 - August 1)

| Day | Goal | Success Criteria |
|-----|------|------------------|
| **Mon 26** | Dashboard foundation + New Idea flow | ✅ Dashboard visible, modal working |
| **Tue 27** ✅ | Continue/Save buttons + Saved ideas | Ideas can be saved and appear in the list |
| **Wed 28** | Budget tracking + OpenRouter cost monitoring | Daily $10 limit, warning system |
| **Thu 29** | Responsive design + mobile compatibility | Works on mobile devices |
| **Fri 30** | Weekly demo + Peerlist post | Video/GIF + written post |
| **Sat 31** | Debugging + refactoring | tsc clean, build clean, learning.md updated |
| **Sun 1** | **REST** + Week 2 planning | — |

**Week 1 Output:** Working dashboard, idea saving, budget tracking, 1 Peerlist post

---

## WEEK 2 (August 2-8)

| Day | Goal | Success Criteria |
|-----|------|------------------|
| **Mon 2** | Start AI integration (OpenRouter) | Real AI analysis instead of mock |
| **Tue 3** | Market Intelligence — automated market research | Pull data from the web when an idea is entered |
| **Wed 4** | Competitor analysis + TAM/SAM/SOM calculation | Competitor list, market size estimation |
| **Thu 5** | Automatic technical plan generation | Idea → Technical specification |
| **Fri 6** | Weekly demo + Peerlist post | Video showing new features |
| **Sat 7** | Debugging + refactoring | — |
| **Sun 8** | **REST** + Week 3 planning | — |

**Week 2 Output:** Real AI analysis, market research, technical planning

---

## WEEK 3-4 (August 9-22)

| Week | Focus | Goal |
|------|-------|------|
| **Week 3** | Auto-Build | Idea → Code → MVP generation (simple version) |
| **Week 4** | Deploy + Growth | Vercel deployment, SEO, landing page |

**Phase 1 Output:** User enters an idea, AI analyzes it, creates an MVP, and deploys it. Everything happens inside the dashboard.

---

# PHASE 2: GROWTH (1-2 months) — GOAL: First Real Users

## SEPTEMBER 2026

| Week | Focus | Goal |
|------|-------|------|
| 1-2 | Improve Market Intelligence | Deeper market research |
| 3-4 | Auto-SEO + content generation | Automatic blog and social media post creation |

## OCTOBER 2026

| Week | Focus | Goal |
|------|-------|------|
| 1-2 | Growth Engine | A/B testing, landing page optimization |
| 3-4 | Opportunity Radar | Daily trend detection, opportunity suggestions |

**Phase 2 Output:** First 10 real users, first $ revenue (affiliate/product), 500+ followers

---

# PHASE 3: SCALE (2-3 months) — GOAL: Sustainable Revenue

## NOVEMBER 2026

| Focus | Goal |
|-------|------|
| Self-improvement | AI optimizes its own performance |
| Multi-project | Manage multiple projects |
| Revenue optimization | Analyze which products generate revenue |

## DECEMBER 2026

| Focus | Goal |
|-------|------|
| Community | User-to-user knowledge sharing |
| Template marketplace | Sell successful projects as templates |

**Phase 3 Output:** $500+/month revenue, 50+ active users, 10+ templates

---

# PHASE 4: PLATFORM (3-6 months) — GOAL: Ecosystem

## JANUARY-MARCH 2027

| Focus | Goal |
|-------|------|
| Installable | Others can install Nucleus on their own servers |
| Plugin ecosystem | Third-party developers create plugins |
| API marketplace | Sell their own APIs |

## APRIL-JUNE 2027

| Focus | Goal |
|-------|------|
| White-label | Users can use it under their own brand |
| Enterprise | Licensing for companies |

**Phase 4 Output:** 1000+ users, $5000+/month revenue, 50+ plugins

---

# DAILY RITUAL (Every Day)

| Time | Task | Duration |
|------|------|----------|
| Morning | Open START_HERE.md, remember the goal | 2 min |
| Development | Work using the 5-5-10-5-5 rule | 2-4 hours |
| Noon | Budget check (OpenRouter spending) | 2 min |
| Evening | Peerlist/LinkedIn daily post (if applicable) | 15 min |
| Night | Update learning.md, define tomorrow's plan | 10 min |

---

# WEEKLY RITUAL (Every Week)

| Day | Task |
|-----|------|
| Monday | Define weekly goals |
| Wednesday | Mid-week check: Am I on track? |
| Friday | Prepare weekly demo |
| Saturday | Retro: What went well, what went wrong, what did I learn? |
| Sunday | **REST** + plan next week |

---

# MONTHLY RITUAL (Every Month)

| Week | Task |
|------|------|
| Week 1 | Vision check: Am I still aligned with the "AI-Native OS" vision? |
| Week 2 | Budget review: Did we exceed the $50 limit? Why? |
| Week 3 | User metrics: How many users, how much revenue? |
| Week 4 | Retro + next month's planning |

---

# CRITICAL CHECKPOINTS

| When | Check | If No |
|------|-------|-------|
| Every day | Budget < $10/day | Switch to cheaper models, stop spending |
| Every week | Vision check | Read CONTEXT.md, correct deviation |
| Every month | Revenue > $0 | Focus on marketing, not product |
| Every phase | Are goals completed? | Extend the phase or reduce scope |

---

# SUCCESS CRITERIA (End of Each Phase)

| Phase | Success |
|-------|---------|
| Phase 1 | Dashboard works, idea → analysis → save flow completed |
| Phase 2 | First real user, first $ revenue, 500+ followers |
| Phase 3 | $500+/month, 50+ users, sustainable system |
| Phase 4 | $5000+/month, 1000+ users, ecosystem |

---

# RISKS AND BACKUP PLANS

| Risk | Probability | Backup Plan |
|------|-------------|-------------|
| OpenRouter costs increase | Medium | Switch to cheaper models (Llama 3.1), try local LLM |
| Next.js breaking change | Low | Lock version (package.json), delay updates |
| Competitor (Emergent, etc.) builds the same thing | Medium | Emphasize local-first + zero equity advantage |
| Low user interest | Medium | Increase Build in Public activity, engage community |
| Technical debt accumulates | High | Every Saturday is refactoring day, Quality Agent |

---

# LAST UPDATE

2026-07-27 — Phase 1, Day 2 completed (Continue/Save/Saved Ideas, verified in-browser). Day 3 (budget tracking) is next.