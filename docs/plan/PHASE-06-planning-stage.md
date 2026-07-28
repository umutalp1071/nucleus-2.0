# PHASE 06 — PLANNING STAGE

**Goal:** a validated idea becomes a plan someone could act on Monday morning.

**Why now:** validation tells you *whether*. Planning tells you *what*. This is
the first stage where Nucleus produces something a founder would otherwise pay
a consultant for — and it is the gap every app-builder competitor leaves wide
open.

---

## Scope

**In:** `plan-venture` and `scope-mvp` tasks, positioning + ICP + MVP scope +
milestones as artifacts, the `planned` stage transition, plan renderers,
regenerate-with-feedback.

**Out of scope:** task tracking (Phase 07). Landing page (Phase 08). Financial
modelling and pricing strategy (Backlog — needs real market data to not be
fiction).

---

## Steps

### 1. `plan-venture` task

Tier `mid`, minTier `cheap`. Input: the venture plus its validation and
competitor artifacts. Producing a plan without feeding in the verdict is how
you get a plan that ignores its own risk analysis.

```ts
const PlanSchema = z.object({
  positioning: z.object({
    oneLiner: z.string().max(140),        // "X for Y who Z"
    category: z.string(),                  // the shelf it sits on
    wedge: z.string(),                     // the narrow first win
  }),
  icp: z.object({
    who: z.string(),
    where: z.array(z.string()).min(2).max(5),   // where to actually find them
    currentSolution: z.string(),                 // what they do today instead
    switchTrigger: z.string(),                   // what makes them change
  }),
  differentiation: z.array(z.string()).min(2).max(4),
  firstTenUsers: z.string(),              // concrete plan for users 1-10
  successMetric: z.object({ metric: z.string(), target: z.string(), by: z.string() }),
  killCriteria: z.string(),               // when to stop. REQUIRED.
});
```

`killCriteria` is required for the same reason `whyNot` was: a plan without a
stopping condition is how people burn a year. Defining the exit before the
entry is the discipline the whole product is selling.

`where` must be concrete channels ("r/languagelearning", "Discord servers for
X"), not "social media". Say so in the prompt and give an example of a bad
answer — negative examples move models more than positive ones.

### 2. `scope-mvp` task

Tier `mid`. Input: venture + plan.

```ts
const MvpScopeSchema = z.object({
  coreLoop: z.string(),                  // the ONE thing the user does repeatedly
  mustHave: z.array(z.object({ feature: z.string(), why: z.string() })).max(5),
  explicitlyNot: z.array(z.string()).min(3),   // what v1 will NOT do
  milestones: z.array(z.object({
    name: z.string(), outcome: z.string(), estimateDays: z.number().max(14),
  })).min(3).max(6),
  stack: z.object({ recommendation: z.string(), reasoning: z.string() }),
  riskiestAssumption: z.string(),
});
```

Constraints in the prompt that make this useful rather than generic:
- `mustHave` capped at 5. A model given no cap returns 12 features and the
  scope is meaningless.
- `explicitlyNot` needs at least 3. The cuts are the scope.
- No milestone exceeds 14 days. Longer means it isn't a milestone.

### 3. Stage transition

`POST /api/ventures/[id]/advance` with the venture at `validated` runs both
tasks in sequence and advances to `planned`.

Budget interaction: two `mid` calls. If the second is blocked, the first's
artifact is **still saved** and the venture stays at `validated`. Partial
progress is never discarded — the user paid for it.

Test this specific case. It's the kind of thing that works in the happy path
and silently loses data at the cap.

### 4. Renderers

`PlanArtifact` and `MvpScopeArtifact` in
`src/components/venture/artifacts/`.

Design intent: this should read like a strategy document, not a JSON dump.
Positioning one-liner as a pull quote. `explicitlyNot` visually distinct —
struck through or muted — because the cuts are the most valuable part and
nobody reads them if they look like more features. Milestones as a timeline.

Before building this, read the `frontend-design` skill. This is the screen a
user screenshots and shares; it deserves real design attention.

### 5. Regenerate with feedback

A "Not quite — tell Nucleus why" control on each plan artifact. The user's
note is appended to the prompt on regeneration; the previous artifact is kept
(versioned by `createdAt`, not overwritten).

This is the cheapest possible human-in-the-loop and it is what makes the
output feel collaborative instead of oracular. Each regeneration is a normal
gateway call — budgeted, cached, logged.

---

## Acceptance

```bash
npm run verify
```

- Fixtures for both tasks validate against their schemas
- A validated venture advances to `planned` and both artifacts render
- Schema caps enforced: a fixture with 7 `mustHave` entries fails validation
  (test it)
- Blocked second call → first artifact persisted, stage unchanged, readable
  message (test it)
- Regenerate with feedback produces a second artifact; both are retained
- Browser-verified, screenshots read, both themes

---

## Risks

| Risk | Mitigation |
|---|---|
| Plans are generic MBA filler | Schema forces specificity (`where` as named channels, `killCriteria`, `explicitlyNot`); negative examples in the prompt; spot-check 3 real ventures and record honestly in `learning.md` |
| Two chained calls double cost per advance | Both at `mid`, downgradable; per-venture cost visible in the workspace |
| Regeneration loop burns budget | Each pass is a normal budgeted call; the guard already covers it |
| Artifact versions clutter the workspace | Show latest by default, prior versions collapsed |

---

## Peerlist posts

**A — SHIP:** *"Nucleus now writes the plan, including when to quit."*
Show a real plan for a real idea. Focus on the two required fields other tools
don't have: `killCriteria` and `explicitlyNot`. Every AI planner adds
features; this one is graded on what it removes. Screenshot the milestone
timeline.

**B — LESSON:** *"Capping a schema field at 5 improved my AI output more than
any prompt tweak."*
The concrete finding: asking for "the must-have features" returned twelve
every time, which is the same as no scope at all. `.max(5)` in the Zod schema,
restated in the prompt, forced actual prioritisation — the model had to argue
with itself. Same trick on `explicitlyNot` with `.min(3)`, forcing it to name
cuts. The general principle: **schema constraints are prompt engineering**, and
they're enforceable in a way prose instructions never are. Ask: what's the
best output constraint you've found that wasn't a prompt change?
