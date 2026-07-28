# THE ANSWER

> "How can this vision be transformed into a concrete, scalable, reliable system
> using the best software engineering principles?"

This document is the reasoning. The `PHASE-*.md` files are the execution.
Read this once. Then never argue with it again — argue with the phase files.

---

## 1. What Nucleus actually is

The vision statement:

> "Everyone should have their own AI venture studio — running on their own
> computer, under their own control, without requiring technical knowledge,
> with a $50/month budget."

Strip the marketing and four hard requirements remain. Each one is an
engineering constraint, not a feeling:

| Vision phrase | Engineering requirement |
|---|---|
| "their own computer / own control" | No mandatory cloud account. Data on disk, in a format the user can read and take. |
| "venture studio" | The unit of work is a **venture** with a lifecycle — not a chat, not a file, not an app. |
| "without technical knowledge" | The user never sees a model name, a token count, a prompt, or a stack trace. |
| "$50/month budget" | The budget is a **system invariant enforced before every AI call**, not a number on a dashboard. |

Everything in this plan follows from those four rows.

---

## 2. The honest scope correction

`docs/MASTER_PLAN.md` schedules "Idea → Code → MVP generation" for Week 3 and
"Deploy + Growth + SEO" for Week 4. That is Lovable plus Vercel plus a growth
suite, in fourteen days, by one person, on $50/month.

`docs/mistakes/nucleus-1.0-lessons.md` opens with lesson #1: *obsession with
technical perfection killed 1.0 by destroying momentum*. Lesson #11: *built
technically impressive products with no distribution*. A roadmap that promises
autonomous full-stack codegen in two weeks does not violate lesson #1 by being
too perfectionist — it violates it by guaranteeing that **nothing ships at
all**, which is the same death by a different road.

So the scope is corrected, deliberately, with the founder's explicit approval:

**Nucleus 2.0 v1 is a Venture Copilot, not an app generator.**

It does the work nobody else does:

- validates the idea and is willing to tell you to **kill** it
- analyzes competitors and positioning
- scopes the MVP and produces a build plan
- generates and deploys the **landing page** (real, public, a URL)
- produces the growth and build-in-public content
- governs every dollar of AI spend against a hard cap

It does **not** generate the product's own source code. It hands a precise
spec to whatever build tool you use (Claude Code, Lovable, your own hands) and
tracks the venture around it. Codegen is a documented plugin seam, not a
promise.

This is not a smaller vision. It is a **sharper** one. Competitors build apps.
Every one of them stops at "here is your app" and leaves the founder alone
with the actual hard part. Nucleus runs the business.

---

## 3. The five engineering decisions that matter

Everything else is detail. These five are the system.

### 3.1 One chokepoint for all AI traffic

Every LLM call in the entire codebase goes through exactly one function:

```ts
runTask(taskName, input) -> Promise<TypedResult>
```

Nothing else may talk to a model. This is enforced by a test that fails the
build if any file outside `src/server/ai/provider.ts` mentions the OpenRouter
host.

Why this is the most important decision in the project: it is the single
point at which budget, caching, model routing, schema validation, retries,
logging, and degradation are enforced. Without it, each of those becomes a
policy that every call site must remember to follow — and one forgotten call
site is a $50 budget breach or an unparseable response in production.

One chokepoint turns six cross-cutting concerns into six lines in one file.

### 3.2 The budget is a pre-flight guard, not a report

The naive design meters spending and shows a number. That design **cannot**
honor the vision, because by the time the number is red the money is gone.

Correct design:

```
estimate cost  →  check against daily/weekly/monthly caps  →
  ├─ fits            → send, then write actual cost to ledger
  ├─ fits cheaper    → downgrade model tier, send, ledger
  └─ breaches        → refuse, return a user-readable reason. No request sent.
```

The caps ($10/day, $30/week, $50/month) live in settings. The spend is
**derived by summing the call ledger** over time windows — never stored as a
counter, because counters drift and drifted counters breach budgets.

This makes "$50/month" a property the system cannot violate rather than a
promise the user has to trust.

### 3.3 Every AI output is schema-validated at the boundary

An LLM returns text. Text is not a type. The gap between them is where
LLM applications rot.

Every task declares a Zod schema. The gateway validates, and on failure
retries once with the validation error appended to the prompt, then fails
loudly. No `JSON.parse` in a component. No optional-chaining through a
response shape nobody guarantees. **The model's output becomes a domain type
at exactly one place, or it does not enter the system.**

### 3.4 The event log is the source of truth for everything narrative

Every meaningful thing that happens — a venture advances a stage, an idea gets
killed, a budget guard fires, a deploy succeeds — appends one row to `events`.

That single log then feeds, with no extra bookkeeping:

- the dashboard activity feed
- the build-in-public post generator
- the "what did we learn" session protocol
- the mistake/error database
- future analytics

Lesson #9 in the lessons file demands "permanent organizational memory" and
lesson #14 demands "a system that learns." An append-only event log **is**
that, implemented. Prose in markdown is not.

### 3.5 Local-first storage, adapters at the edges

Storage is JSON files under `.nucleus/`. Not Supabase, not yet.

Three reasons, in order of weight:

1. **It is what the vision says.** "Running on their own computer, under their
   own control." A file the user can open, read, back up, and delete is
   literal control. A hosted Postgres row is not.
2. **It has no setup step.** Nucleus works thirty seconds after `git clone`,
   with no account, no key, no dashboard. That is the difference between a
   product people try and a product people bounce off.
3. **It makes autonomous execution possible.** Sonnet 5 cannot create a
   Supabase project. A plan that requires one is a plan that stalls on step 4
   waiting for a human.

The same reasoning gives every external dependency a **mock-by-default
adapter**: AI provider, deploy target. Each is real when its key is present
and a deterministic fake when it is not. This is not defensive
over-engineering — it is the only way the entire system stays testable,
demoable, and executable with zero external accounts. Supabase arrives in
Phase 11 behind the repository interface, when multi-user actually needs it.

---

## 4. The domain model

The single most valuable modeling decision: **the noun is `Venture`, not
`Idea`.**

An idea is a string. A venture is a thing with a lifecycle, artifacts, spend,
and a verdict. Naming it correctly is what makes "builds businesses, not apps"
true in the code rather than in the pitch.

```
captured ──▶ validated ──▶ planned ──▶ building ──▶ launched ──▶ growing
                  │
                  └──▶ killed          (a first-class, celebrated outcome)
```

`killed` being a real stage is a product feature. A studio that cannot say no
is not a studio, it is a spending machine. The system that tells you to stop
is worth more than the one that always says yes — and it is the single most
shareable thing this product does.

Each transition is an AI task through the gateway, produces a stored
**artifact**, and appends an **event**.

---

## 5. Reliability: what "won't break" means here

| Failure mode | Defense | Phase |
|---|---|---|
| Budget breach | Pre-flight guard; ledger-derived spend | 2 |
| Unparseable AI output | Zod at the boundary, one repair retry | 2 |
| Model/provider outage | Tier fallback, then queued-with-reason | 2 |
| Runaway cost from retries | Retries counted against the same budget check | 2 |
| Silent regression | `npm run verify` gate + CI on every push | 0 |
| Server code leaking to the browser | Import-boundary test | 0 |
| Data loss | Atomic writes, timestamped backups, full export | 1 |
| Vision drift | Automated drift check against this document | 12 |
| Repeated mistakes | Errors captured as data into the mistake DB | 12 |

---

## 6. Scalability: what actually needs to scale

Not requests. There is one user. What has to scale is **capability without
rewrite**:

- **New AI task** = one file in `src/server/ai/tasks/`. Prompt + schema +
  tier. Zero changes to the gateway, budget, UI plumbing, or logging.
- **New lifecycle stage** = one entry in the stage table + one task file.
- **New storage backend** = one module implementing the repository type.
- **Multi-user** = swap that module, add auth, add a `user_id` column. The
  schema is already shaped for it.
- **Codegen plugin** = a new task tier and a new artifact kind.

The measure of this architecture is not how much it does today. It is that
each of the five expansions above touches exactly one file.

---

## 7. Marketing is a subsystem, not a chore

Lessons #2, #3, #4, #11, and #12 all say the same thing: 1.0 died invisible.

So build-in-public is not a docs folder in this design. It is **Phase 10, a
product feature**, fed by the event log, generating post drafts from real
system state. Every phase in this plan also ships two ready-to-publish
Peerlist posts as a hard gate in the Definition of Done — a phase is not
complete without them.

Dogfooding closes the loop: Nucleus generates the build-in-public content for
Nucleus. That story is itself the marketing.

---

## 8. Summary

Concrete: one chokepoint, one event log, one domain noun, files on disk, a
phase plan with runnable acceptance criteria.

Scalable: every axis of growth is a single-file change.

Reliable: budget cannot be breached, AI output cannot enter untyped, nothing
merges without `npm run verify` passing, and every external dependency has a
deterministic fake.

Best practices applied where they earn their place: TDD on logic, typed
boundaries, dependency inversion at exactly the three edges that have two
implementations, append-only audit log, no abstraction with one implementation
and no second implementation coming.

Now go execute `PHASE-00.md`.
