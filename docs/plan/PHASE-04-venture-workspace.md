# PHASE 04 — VENTURE WORKSPACE

**Goal:** the dashboard stops being a mockup. Every number on screen is real.

**Why now:** validation produces artifacts nobody can read. The product is
currently a beautiful lie — hardcoded "LangTutor AI • 847 users • $210/mo" next
to genuine AI output. Delete the lie.

---

## Scope

**In:** `/ventures/[id]` workspace page, stage timeline, artifact renderers,
dashboard rebuilt on real data, activity feed from the event log, export wired
up, empty states.

**Out of scope:** planning/build/launch/growth tasks (Phases 06–09). Settings
(Phase 05). Any new AI task.

---

## Steps

### 1. Delete `mock-data.ts`

Every hardcoded project, growth metric, and activity item goes. If a card has
no real data source yet, it either shows a real empty state or it is removed
from the page. **A card showing invented numbers is worse than no card** — it
trains the founder to ignore their own dashboard.

`quickActions` may stay as static UI config; it isn't fake data.

### 2. Venture workspace — `src/app/ventures/[id]/page.tsx`

Server component. Layout:

```
← All ventures
┌──────────────────────────────────────────────┐
│ Title                       [stage badge]    │
│ the idea, as written                          │
├──────────────────────────────────────────────┤
│ ● Captured ─ ● Validated ─ ○ Planned ─ ○ ... │   stage timeline
├──────────────────────────────────────────────┤
│ Verdict  34/100  KILL                         │
│ "Crowded market, no clear wedge."             │
│ Why not: ...                                  │
│ Cheapest test: ...                            │
│ Risks: ...                                    │
├──────────────────────────────────────────────┤
│ Competitors (collapsed)                       │
├──────────────────────────────────────────────┤
│ [ Advance to Planning ]  [ Kill ]  [ Archive ]│
│ Spend on this venture: $0.04                  │
└──────────────────────────────────────────────┘
```

The per-venture spend line matters: it is the first place a user sees the cost
of a decision, attached to the decision. Keep it.

### 3. Artifact renderers — `src/components/venture/artifacts/`

One component per artifact `kind`, dispatched by a small switch. Adding an
artifact kind later must mean adding one file, not editing five.

`kind: "validation"` and `"competitors"` render for real now. Unknown kinds
fall back to a readable definition-list rather than crashing — a renderer that
throws on an unexpected shape takes the whole page down.

### 4. Stage timeline — `src/components/venture/StageTimeline.tsx`

Drives off `STAGE_ORDER` and the venture's stage. `killed` renders as a
distinct terminal branch, not a failure state — muted, not red. Killing an
idea early is a win, and the UI should not shame it.

### 5. Dashboard rebuild — `src/app/page.tsx`

- **Ventures** grouped by stage, most recently updated first
- **Budget** — real spend from `/api/budget` (the endpoint exists in Phase 02;
  the settings UI is Phase 05)
- **Activity** — real, from `/api/events`, using the `summary` strings written
  in Phase 01
- **New Idea** — unchanged flow, now navigating to the workspace on success

Empty state when there are zero ventures: one sentence and the New Idea
button. No fake sample data, ever.

### 6. Wire up export

`src/lib/idea-export.ts` has existed unused since Day 2. Point it at real
ventures, add the button to the dashboard, extend it to include artifacts in
the JSON export. Filename `nucleus-ventures-YYYY-MM-DD.json`.

This closes `docs/NEXT_FEATURES.md`, which came from an actual Peerlist
conversation about not becoming an idea silo — worth mentioning in the post.

### 7. Responsive + dark mode pass

The theme tokens and `.dark` class already exist in `globals.css` but nothing
toggles them. Add a toggle in the header persisting to `localStorage`.
Verify both themes and a 375px viewport in the browser.

---

## Acceptance

```bash
npm run verify
```

- `grep -r "LangTutor\|MarketScout\|Recipe Remix" src/` → nothing
- Browser-verified via the `run-dashboard` skill, **screenshots read**:
  1. empty dashboard → create idea → validate → land on workspace
  2. workspace renders the real verdict with `whyNot` above the fold
  3. kill a venture → timeline shows the terminal branch
  4. dark mode at 375px wide, both themes legible
  5. export downloads a JSON file containing ventures **and** artifacts
- Activity feed shows real event summaries, newest first

---

## Risks

| Risk | Mitigation |
|---|---|
| Dashboard looks empty and sad post-mock-deletion | Design the empty state deliberately as an invitation; it is a real screen, not a fallback |
| Artifact renderer crashes on an unexpected shape | Default case renders a definition list; never throw in a renderer |
| Server component tries to fetch its own API route | Server components import repositories directly. Only client components use `/api/*` |

---

## Peerlist posts

**A — SHIP:** *"I deleted every fake number from my dashboard."*
Before/after screenshots. The mock dashboard looked more impressive than the
real one — three projects, 847 users, $210 MRR, all invented. The real one has
one venture and a $0.04 spend. Argue that the second is worth more: a
dashboard you can't trust is a dashboard you stop reading, and the fake numbers
were quietly training me to ignore my own product.

**B — LESSON:** *"Someone on Peerlist told me not to build a silo, so I built
the export first."*
The `NEXT_FEATURES.md` story — a comment on an earlier post raised that Nucleus
shouldn't trap ideas, so export shipped before most features. Make the broader
point about building in public actually changing the roadmap rather than just
documenting it. Concrete: full-fidelity JSON including artifacts, plus CSV,
one click, no account. Ask: what's the last feature a stranger's comment
talked you into?
