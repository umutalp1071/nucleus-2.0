# PHASE 00 — GROUND TRUTH

**Goal:** make it impossible to break Nucleus without knowing.

**Why now:** there are zero tests and zero CI in a project whose stated purpose
is "a system that learns and improves." Every phase after this one adds
budget arithmetic, schema parsing, and stage machines — logic that fails
silently. This phase is the harness that catches it. It ships no features and
it is the highest-leverage phase in the plan.

---

## Scope

**In:** vitest, CI, zod-validated config, boundary tests, `npm run verify`,
`.nucleus/` gitignore, repo cleanup.

**Out of scope:** any feature. Any AI. Any UI change. Any dependency beyond
the four named below. Do not "quickly also" do Phase 01's domain types.

---

## Steps

### 1. Install the test harness

```bash
npm i -D vitest zod
```

`zod` is a runtime dependency, not dev — move it to `dependencies`. It is
needed at request time for config and LLM output validation.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

### 2. The verify gate

`package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"verify": "tsc --noEmit && next lint && vitest run"
```

### 3. Validated config

`src/server/config.ts` — every env var the system will ever read, validated
once at startup, with safe defaults so the app runs with an empty environment.

```ts
import { z } from "zod";

const schema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  NUCLEUS_DATA_DIR: z.string().default(".nucleus"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const config = schema.parse(process.env);
export const hasAiKey = () => Boolean(config.OPENROUTER_API_KEY);
```

Absent keys are **not** an error. Absent keys select the mock adapters. That
is the design, not a fallback.

Write `tests/config.test.ts`: parses an empty env; rejects an invalid
`NODE_ENV`.

### 4. Boundary tests

`tests/boundaries.test.ts` — reads source files with `node:fs` and asserts the
architecture rules. This is the cheapest architecture enforcement that exists.

Assert:
- no file containing `"use client"` imports from `@/server` or `../server`
- no file outside `src/server/ai/provider.ts` contains `openrouter.ai`
- no file outside `src/server/db/store.ts` imports `node:fs`
- no file under `src/lib/` imports a `node:` builtin

Write the test now with the rules; three of the four targets do not exist yet,
so the test passes vacuously and starts failing the moment someone violates a
rule. That is exactly the desired behavior.

### 5. CI

`.github/workflows/ci.yml` — on push and PR to `main`:

```yaml
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run verify
      - run: npm run build
```

`next build` runs after `vitest`, in CI only, never alongside a running dev
server.

### 6. Repo hygiene

- `.gitignore`: add `.nucleus/`, `/graphify-out/cache/`, `tsconfig.tsbuildinfo`
- `git rm --cached tsconfig.tsbuildinfo` — it is committed and shouldn't be
- `docs/MASTER_PLAN.md`: add a header banner marking it **superseded by
  `docs/plan/`** for scope. Do not delete it; the phase timeline is still a
  useful record and deleting it destroys context.
- `docs/NEXT_FEATURES.md`: it describes idea export, which
  `src/lib/idea-export.ts` already implements but nothing calls. Move the file
  to `docs/plan/BACKLOG.md` as an entry; export gets wired up in Phase 04.

### 7. Sanity test

`tests/smoke.test.ts` — one test asserting `config` loads. Proves the harness
runs at all. Delete it once real tests exist.

---

## Acceptance

```bash
npm run verify      # passes, and vitest reports > 0 tests
npm run build       # passes (dev server NOT running)
```

- `tests/boundaries.test.ts` fails if you temporarily add `import fs from
  "node:fs"` to `src/lib/format.ts`. **Verify this by actually doing it and
  reverting.** A test you haven't seen fail is not a test.
- CI green on the pushed commit.

---

## Risks

| Risk | Mitigation |
|---|---|
| `next lint` fails on existing code | Fix the lint errors; do not weaken the config |
| vitest + Next path aliases misconfigured | The `resolve.alias` above; verify with one aliased import in a test |
| Boundary test regexes produce false positives | Match on import statements, not bare substrings; exclude `tests/` and comments |

---

## Peerlist posts

**A — SHIP:** *"I wrote 1,318 lines before I wrote a single test."*
The honest confession opening. What the harness does, why boundary-tests-as-
regex is an underrated 30-line architecture guard, and the number: 4 runtime
dependencies. Code block: the boundary test.

**B — LESSON:** *"A test you've never seen fail isn't a test."*
The discipline of breaking your own assertion on purpose before trusting it.
Concrete: adding `node:fs` to a client-safe file to watch the boundary test go
red, then reverting. Rejected alternative: an ESLint `no-restricted-imports`
rule — more config, worse error messages, and it can't express "only this one
file may do this."
