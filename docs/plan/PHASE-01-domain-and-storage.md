# PHASE 01 — DOMAIN & STORAGE

**Goal:** replace "an idea in localStorage" with "a venture on disk."

**Why now:** every later phase writes artifacts, events, and AI call records.
They all need somewhere real to go, and they all need the domain vocabulary to
be right. Naming the noun `Venture` instead of `Idea` is the modeling decision
that makes "builds businesses, not apps" true in code.

---

## Scope

**In:** domain types + zod schemas, stage machine, atomic JSON store,
repositories, migration of existing localStorage ideas, `/api/ventures`.

**Out of scope:** any AI call. Any new UI (the dashboard keeps working off the
new API but gets no redesign — that's Phase 04). Supabase. Auth.

---

## Steps

### 1. Domain (`src/lib/domain.ts`)

Client-safe. Zod schemas as the single source of truth; derive TS types with
`z.infer`. Define `Stage`, `Venture`, `Artifact`, `NucleusEvent`, `AiCall`
exactly as specified in `ARCHITECTURE.md` §Domain model.

### 2. Stage machine (`src/lib/stages.ts`)

```ts
export const STAGE_ORDER: Stage[] = [
  "captured", "validated", "planned", "building", "launched", "growing",
];

const TRANSITIONS: Record<Stage, Stage[]> = {
  captured:  ["validated", "killed", "archived"],
  validated: ["planned", "killed", "archived"],
  planned:   ["building", "archived"],
  building:  ["launched", "archived"],
  launched:  ["growing", "archived"],
  growing:   ["archived"],
  killed:    ["archived"],
  archived:  [],
};

export function canTransition(from: Stage, to: Stage): boolean;
export function assertTransition(from: Stage, to: Stage): void;  // throws
export function nextStage(from: Stage): Stage | null;
export function stageLabel(s: Stage): string;   // "Validated", "Killed"
```

**TDD required.** Write `tests/stages.test.ts` first: legal transitions pass,
illegal throw, `archived` is terminal, `killed` can only be reached from
`captured`/`validated`, every stage in `STAGE_ORDER` has a `TRANSITIONS` entry.

That last assertion is the one that saves you later — it fails the moment
someone adds a stage and forgets the transition table.

### 3. The store (`src/server/db/store.ts`)

The only file allowed to touch `node:fs`. Roughly 40 lines.

```ts
export async function readCollection<T>(name: string): Promise<T[]>;
export async function writeCollection<T>(name: string, rows: T[]): Promise<void>;
```

Requirements:
- data dir from `config.NUCLEUS_DATA_DIR`, created on demand
- missing file → `[]`, never throws
- corrupt JSON → back the bad file up to `backups/`, return `[]`, and
  **record the incident** (a `console.error` for now; Phase 11 turns it into a
  real event). Never crash on a corrupt file — that would strand the user's
  data behind a stack trace.
- writes are atomic: write `name.json.tmp`, then `fs.rename`. A crash mid-write
  must never leave a truncated file.
- keep the last 5 backups per collection, prune older

```
ponytail: whole-file rewrite per mutation, single writer, no locking.
Ceiling ~10k rows. Upgrade path: swap this module for node:sqlite —
repositories are the only callers.
```

**TDD required.** `tests/store.test.ts` against a temp dir: round-trip, missing
file, corrupt file recovery, atomicity (assert no `.tmp` remains), backup
pruning.

### 4. Repositories (`src/server/db/repositories/`)

Plain async functions. No classes, no base repository, no generic CRUD factory.

- `ventures.ts` — `list`, `get`, `create`, `update`, `advance(id, toStage)`
  (calls `assertTransition`, bumps `updatedAt`, records an event), `remove`
- `artifacts.ts` — `listByVenture`, `create`, `latestOfKind`
- `events.ts` — `list(limit)`, `create`
- `aiCalls.ts` — `create`, `sumSince(date)`
- `settings.ts` — `get(key)`, `set(key, value)`, with typed defaults for
  budget caps

`advance()` is the only path that changes a stage. The API never writes
`stage` directly — that is how the transition table stays authoritative.

### 5. Events (`src/server/events.ts`)

```ts
export async function recordEvent(
  type: string,
  summary: string,
  opts?: { ventureId?: string; payload?: unknown }
): Promise<void>;
```

Every repository mutation that matters calls it. `summary` is one human
sentence written for the activity feed — "Validated *AI recipe planner* —
scored 34/100", not "venture.updated".

Write it well. This string becomes marketing copy in Phase 10.

### 6. API routes

- `GET /api/ventures` → list
- `POST /api/ventures` → create from `{ title, description }`, stage `captured`
- `GET /api/ventures/[id]`
- `PATCH /api/ventures/[id]` → title/description only, never stage
- `DELETE /api/ventures/[id]` → archive (soft), not hard delete
- `GET /api/events?limit=20`

Validate every request body with a zod schema. Return `400` with a readable
message on failure — never let an unvalidated body reach a repository.

### 7. Migrate off localStorage

`src/lib/idea-storage.ts` currently holds real user data in the browser.
Do not silently orphan it.

- On dashboard mount, if `nucleus:saved-ideas` exists in localStorage and has
  rows, POST each to `/api/ventures`, then clear the key and show a one-line
  toast: "Moved N saved ideas into Nucleus."
- Delete `src/lib/idea-storage.ts` and its imports afterward.
- Keep `src/lib/idea-export.ts` — Phase 04 wires it to the real store.

### 8. Wire the existing dashboard

Minimum change only. `src/app/page.tsx` fetches `/api/ventures` instead of
reading localStorage; `SavedIdeasCard` renders `Venture[]` instead of
`SavedIdea[]`. `mock-data.ts` keeps supplying projects/growth/activity for now
— those get replaced in Phase 04. **Do not redesign anything here.**

---

## Acceptance

```bash
npm run verify
```

- `tests/stages.test.ts`, `tests/store.test.ts`, `tests/repositories.test.ts`
  all present and passing
- Manual, via the `run-dashboard` skill:
  1. seed `localStorage['nucleus:saved-ideas']` with two ideas, reload →
     migration toast appears, both appear as ventures, localStorage key gone
  2. create a venture through the UI → `.nucleus/ventures.json` contains it
  3. `.nucleus/events.json` has a `venture.created` row with a readable summary
  4. kill the dev server, restart, reload → data still there
- `curl -X PATCH` with `{"stage":"launched"}` does **not** change the stage

---

## Risks

| Risk | Mitigation |
|---|---|
| Migration runs twice, duplicating ventures | Clear the localStorage key inside the same success handler; make it idempotent by checking for the key's existence first |
| `fs` in a Next.js route on the Edge runtime | Route handlers must not opt into Edge. Add `export const runtime = "nodejs"` to every route touching the store |
| Concurrent writes from two tabs corrupt a file | Single-operator product; atomic rename makes the worst case a lost write, not a corrupt file. Noted as a `ponytail:` ceiling |
| Domain types drift from zod schemas | Always `z.infer`, never hand-write a duplicate interface |

---

## Peerlist posts

**A — SHIP:** *"I renamed one type and the whole product got clearer."*
`Idea` → `Venture`. An idea is a string; a venture has a lifecycle, artifacts,
spend, and a verdict — including `killed`. Show the stage transition table.
The point: the vocabulary in your types is the vocabulary of your product, and
"we build businesses not apps" was a slogan until the type system agreed.

**B — LESSON:** *"I chose JSON files over Postgres, on purpose."*
Three reasons: the product promises "your own computer, your own control" and
a file is literally that; zero setup means people actually try it; and an AI
agent building this can't create a Supabase project, so a cloud dependency
would have stalled the build. Name the ceiling honestly (~10k rows, one
writer) and the upgrade path. Rejected: Supabase free tier — better database,
wrong product. Ask: where's your line for "just use a file"?
