# CONVENTIONS & DEFINITION OF DONE

---

## Definition of Done

A phase is done when **every** box is checked. No partial credit, no "mostly."

- [ ] Every step in the phase file is implemented
- [ ] `npm run verify` passes — you ran it, you read the output, this session
- [ ] New logic has a test that fails if the logic breaks
- [ ] UI changes verified in a real browser via the `run-dashboard` skill, and
      you **looked at the screenshot** (a green build proves nothing visual)
- [ ] Nothing from the phase's "Out of scope" list appears in the diff
- [ ] Both Peerlist posts written to `docs/content/drafts/`
- [ ] `PROGRESS.md` updated: phase marked done, decisions recorded, dependency
      ledger updated if a package was added
- [ ] `docs/workflow/learning.md` appended in PROTOCOL.md format with an
      honest Quality Score
- [ ] Committed and pushed

---

## `npm run verify`

One command, the whole gate. Phase 00 creates it:

```json
"verify": "tsc --noEmit && next lint && vitest run"
```

Run it before every commit. CI runs the same command, plus `next build`.

**Never run `next build` while `next dev` is running against the same `.next`
directory** — it corrupts the webpack module cache. This has already cost this
project a debugging session (see `learning.md`, 2026-07-26).

---

## Code style

Match the existing code. It is clean; do not restyle it.

- TypeScript strict. No `any`. `unknown` + a zod parse at boundaries.
- Functions under 50 lines. If one grows past that, it is doing two things.
- Named exports. No default exports except Next.js pages/layouts.
- No comment restating the code. Comments explain *why*, or mark a deliberate
  shortcut with `ponytail:` naming the ceiling and the upgrade path.
- Tailwind only, using the existing theme tokens in `globals.css`
  (`bg-card`, `text-muted-foreground`, `border-border`, …). Never a raw hex
  or a `gray-500` — the dark theme depends on the tokens.
- Server-only modules start with `import "server-only"` once that package
  exists; until then, the boundary test is the enforcement.

### Error handling

- Expected failures return a result object. Unexpected failures throw.
- User-facing messages never contain a model name, token count, stack trace,
  file path, or provider error string. That is the "freedom from needing to
  know" principle, enforced at the message layer.
  - Bad: `OpenRouter 429: rate_limit_exceeded on claude-haiku-4.5`
  - Good: `Nucleus is at today's spending limit. It resets at midnight.`
- Never silently swallow. Every caught error either recovers visibly or
  records an event.

---

## Testing

Vitest. Tests live in `tests/` mirroring `src/`.

**Test these** (they encode decisions and break silently):
- budget guard arithmetic and window boundaries
- stage transition legality
- schema validation + the repair-retry path
- repository read/write/atomicity
- cost estimation and model routing
- module boundary rules

**Do not test** these (churn with no signal):
- React component markup
- Tailwind classes
- straight-through getters
- the mock provider's fixtures

TDD is required for the budget guard, the gateway, and stage transitions.
Elsewhere, test-after is fine if the test genuinely fails without the code.

No test may hit the network. Ever.

---

## Prompts

Prompts live in `src/server/ai/tasks/*.ts` as exported template strings.
Never inline in a component, a route handler, or the gateway.

Every task file exports exactly:

```ts
export const validateIdea = {
  name: "validate-idea",
  tier: "mid",
  minTier: "cheap",
  schema: z.object({ /* ... */ }),
  prompt: (input: Input) => `...`,
} satisfies TaskDef;
```

Prompt engineering rules:
- Ask for JSON matching the schema, and restate the schema in the prompt.
- Give the model permission to be negative. A validator that cannot say
  "don't build this" is a hype machine. This is a product requirement.
- No chain-of-thought padding on `cheap` tier tasks — it is billed output.

---

## Git

- One commit per phase minimum; more if a phase has natural checkpoints.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
  `chore:`.
- Message body: what changed and *why*, two or three lines. The commit log is
  raw material for build-in-public posts — write it like someone will read it.
- Push after every commit. Project rule: push is pre-approved. On a conflict,
  stop and write a `BLOCKED` entry.

---

## Dependencies

The current runtime dependency list is `next`, `react`, `react-dom`,
`tailwindcss-animate`. That is a feature and a talking point.

Before adding anything, climb the ladder: does it need to exist → is it
already here → does stdlib do it → does the platform do it → does an installed
dep do it → is it ten lines?

Approved additions, already justified:

| Package | Why nothing else does it |
|---|---|
| `zod` | Runtime validation of LLM output and env. Hand-rolled validators for ~10 nested schemas is more code and worse errors. |
| `vitest` | Test runner. No stdlib equivalent. |
| `@vitejs/plugin-react` + `jsdom` | Only if a component test is ever genuinely needed. Prefer not. |

Anything else needs a Dependency Ledger entry in `PROGRESS.md` with the
alternatives you rejected. `playwright` stays out of `package.json` forever —
it is agent tooling, installed into the scratchpad (see the `run-dashboard`
skill).

---

## The vision check

Before any non-obvious design decision, answer in one line each:

1. Does this reduce what the user must know? (If it adds, redesign.)
2. Could this breach the budget cap? (If yes, it goes through the guard.)
3. Is this a venture-studio capability, or generic SaaS scaffolding?
4. Does this touch one file per axis of future change, or many?

If you cannot answer #3 with a venture-studio capability, it probably belongs
in `BACKLOG.md`.
