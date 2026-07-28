# Nucleus 2.0

**Development is driven by `docs/plan/`. Read `docs/plan/PROGRESS.md` first,
every session.** It says which phase is current. Then read that phase file and
`docs/plan/CONVENTIONS.md`, and execute via the `nucleus-phase` skill.

The plan is authoritative. If a suggestion contradicts `docs/plan/00-ANSWER.md`,
the document wins.

## What Nucleus is (and isn't)

A single-operator, self-hosted **venture copilot**: it validates ideas (and
recommends killing them), plans them, scopes an MVP, generates and deploys a
landing page, and produces growth + build-in-public content — all under a hard
$50/month AI budget the system structurally cannot exceed.

It does **not** generate the user's application source code. That is a
deliberate scope decision, not a gap. See `docs/plan/00-ANSWER.md` §2.

## Invariants — do not break these

- All AI traffic goes through `runTask()` in `src/server/ai/gateway.ts`.
  A boundary test enforces it.
- Budget is checked **before** the request; spend is derived by summing the
  call ledger, never a stored counter.
- Every AI output is Zod-validated at the boundary. No `JSON.parse` in a
  component.
- `src/server/**` is never imported by a client component.
- User-facing messages contain no model name, token count, or stack trace.
- Data lives in `.nucleus/` as JSON, on the user's own disk.
- Every external dependency (AI, deploy) has a deterministic mock, selected by
  the absence of a key. Tests never hit the network.

## Skills

- **nucleus-phase** (`.claude/skills/nucleus-phase/SKILL.md`) — execute one
  plan phase end to end. Trigger: `/nucleus-phase`
- **run-dashboard** (`.claude/skills/run-dashboard/SKILL.md`) — launch the dev
  server and drive the app in a real headless browser (Playwright, bootstrapped
  into the scratchpad — never added to package.json). Required before claiming
  any UI change works, not just after `tsc`/`next build`.
- **graphify** (`.claude/skills/graphify/SKILL.md`) — any input to knowledge
  graph. Trigger: `/graphify`. When the user types `/graphify`, use the
  installed graphify skill before doing anything else.

## Rules

- Push after every commit; push is pre-approved. On conflict, stop and ask.
- Never add an npm dependency without a Dependency Ledger row in
  `docs/plan/PROGRESS.md`.
- Never run `next build` while `next dev` is running against the same `.next`.
- A phase is not complete without its two Peerlist drafts in
  `docs/content/drafts/`.
