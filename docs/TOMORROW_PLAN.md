# YARININ PLANI — 2026-07-26

## Nucleus 2.0 Faz 1, Gün 1

---

## OTURUM BAŞLANGICI (İlk Mesaj — Claude'a Kopyala)



First, read `docs/CONTEXT.md`.

Today's objective is to build the **foundation of the Nucleus 2.0 dashboard**.

For this session, we are working **only on the UI layer**.

**No backend.**
**No APIs.**
**No AI integrations.**
**No business logic.**

The goal is to end this session with a polished, functional dashboard that can be opened in the browser and interacted with visually.

---

# 5–5–10–5–5 EXECUTION FRAMEWORK

| Phase | Time | Objective |
|--------|------|-----------|
| **Plan** | 5 min | Review the dashboard structure and agree on the component hierarchy. |
| **Decide** | 5 min | Evaluate implementation choices (custom components vs. libraries) and make architectural decisions before writing code. |
| **Build** | 10 min | Implement the dashboard layout: header, sidebar, content area, cards, and responsive structure. |
| **Review** | 5 min | Verify that everything renders correctly, matches the intended design, and contains no errors. |
| **Refine** | 5 min | Polish spacing, typography, responsiveness, and identify the next milestone. |

---

# SESSION GOAL

When the user opens:

`http://localhost:3000`

they should see a clean, modern dashboard similar to this:

```text
┌─────────────────────────────────────────┐
│  🧠 NUCLEUS OS v2.0    💰 $12/$50  🔔 👤 │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────────┐   │
│  │ NEW     │  │ ACTIVE PROJECTS (3) │   │
│  │ IDEA  + │  │ ┌─────────────────┐ │   │
│  │         │  │ │ LangTutor AI    │ │   │
│  │ THIS    │  │ │ Live • 847 users│ │   │
│  │ MONTH   │  │ │ $210/mo • 78%   │ │   │
│  │         │  │ └─────────────────┘ │   │
│  │ AI      │  │ ┌─────────────────┐ │   │
│  │ OPPORT. │  │ │ MarketScout     │ │   │
│  │         │  │ │ Building • 45%  │ │   │
│  └─────────┘  └─────────────────────┘   │
│                                         │
│ [RECENT ACTIVITY] [GROWTH] [QUICK ACTIONS] │
└─────────────────────────────────────────┘



## TOMORROW (2026-07-27) — Phase 1, Day 2 Goals

1. Make the "Continue" button functional → transition to the project creation flow (stub)
2. Make the "Save" button functional → save ideas (mock storage)
3. Add a "Saved Ideas" section to the dashboard
4. Publish a "Day 1" post on Peerlist (with 2 screenshots)
5. Start budget tracking — monitor OpenRouter usage

Target quality score: > 85
```
