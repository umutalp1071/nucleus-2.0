# Graph Report - nucleus-2.0  (2026-07-30)

## Corpus Check
- 186 files · ~87,557 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1111 nodes · 1621 edges · 96 communities (65 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19562af8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ABSOLUTE RULES
- compilerOptions
- vision-check.md
- devDependencies
- package.json
- bugfix.md
- NUCLEUS 2.0 — CONTEXT TRANSFER
- ERROR LOG #[NUMBER]
- include
- TOMORROW_PLAN.md
- extends
- layout.tsx
- next.config.mjs
- postcss.config.mjs
- page.tsx
- tailwind.config.ts
- feature.md
- START_HERE.md
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- Session Learning Log
- CLAUDE.md
- .claude/CLAUDE.md
- extraction-spec.md
- css.d.ts
- include
- NewIdeaFlow.tsx
- Automated Content Generation System
- Nucleus 2.0 — Day 2: Ideas That Stick
- Nucleus 2.0 — Day {{DAY_NUMBER}}: {{TITLE}}
- 2026-07-27-lesson.md
- lesson-post.md
- Run the Nucleus 2.0 dashboard
- Feature: Idea Export (JSON + CSV)
- smoke.js
- writeCollection
- budget.ts
- gateway.ts
- Plan of record
- THE ANSWER
- Steps
- PEERLIST BUILD-IN-PUBLIC PLAYBOOK
- Steps
- Steps
- Steps
- Steps
- Steps
- Steps
- Steps
- Steps
- TARGET ARCHITECTURE
- PHASE 06 — PLANNING STAGE
- PHASE 07 — BUILD STAGE & THE HANDOFF
- PHASE 08 — LAUNCH STAGE
- PHASE 09 — GROWTH STAGE
- CONVENTIONS & DEFINITION OF DONE
- Execute a Nucleus 2.0 phase
- NUCLEUS 2.0 — EXECUTION PLAN
- boundaries.test.ts
- BACKLOG
- regenerate/route.ts
- [id]/route.ts
- build-spec/route.ts
- A test you've never seen fail isn't a test
- I wrote 1,318 lines before I wrote a single test
- I chose JSON files over Postgres, on purpose
- I renamed one type and the whole product got clearer
- A dashboard that shows your spending is not a budget
- My AI budget cap runs before the request, not after
- Every AI idea-validator I've used is a hype machine
- I built an AI that tells me to kill my own ideas
- Someone on Peerlist told me not to build a silo, so I built the export first
- I deleted every fake number from my dashboard
- I refused to encrypt the stored API key, and I think that's the honest call
- Bring your own key. I never see your data or your bill.
- Capping a schema field at 5 improved my AI output more than any prompt tweak
- Nucleus now writes the plan, including when to quit
- config.test.ts
- validateAndAdvance.ts
- planAndAdvance.ts
- domain.ts
- repositories/events.ts
- artifacts.ts
- The best feature I shipped this week makes zero AI calls
- Nucleus doesn't write your code. It writes the brief that does.

## God Nodes (most connected - your core abstractions)
1. `writeCollection()` - 28 edges
2. `Provider` - 20 edges
3. `runTask()` - 19 edges
4. `Plan` - 16 edges
5. `compilerOptions` - 15 edges
6. `recordEvent()` - 14 edges
7. `MvpScope` - 13 edges
8. `readCollection()` - 13 edges
9. `NUCLEUS 2.0 — CONTEXT TRANSFER` - 13 edges
10. `Session Learning Log` - 13 edges

## Surprising Connections (you probably didn't know these)
- `seed()` --calls--> `writeCollection()`  [EXTRACTED]
  tests/budget.test.ts → src/server/db/store.ts
- `GET()` --calls--> `getSpend()`  [EXTRACTED]
  src/app/api/budget/route.ts → src/server/ai/budget.ts
- `POST()` --calls--> `writeCollection()`  [EXTRACTED]
  src/app/api/settings/delete-all/route.ts → src/server/db/store.ts
- `GET()` --calls--> `dataDirInfo()`  [EXTRACTED]
  src/app/api/settings/route.ts → src/server/db/store.ts
- `GET()` --calls--> `renderLandingPage()`  [EXTRACTED]
  src/app/api/ventures/[id]/preview/route.ts → src/server/launch/template.ts

## Import Cycles
- None detected.

## Communities (96 total, 31 thin omitted)

### Community 0 - "ABSOLUTE RULES"
Cohesion: 0.07
Nodes (26): 1. LEARNING.MD UPDATE, 1. UPDATE LEARNING.MD, 1. What did we accomplish?, 2. TOMORROW_PLAN.MD UPDATE, 2. What did we learn?, 3. MASTER_PLAN.MD UPDATE, 3. What is the next step?, 4. CONTENT ENGINE — PEERLIST POST DRAFTS (+18 more)

### Community 1 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, src/types/**/*.d.ts, **/*.ts (+18 more)

### Community 2 - "vision-check.md"
Cohesion: 0.12
Nodes (16): 1. Vision Alignment, 2. User Value, 3. AI-Native Principle, 4. Complexity Check, 5. Scope Check, Alignment Score, EVALUATION CRITERIA, FINAL QUESTION (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.07
Nodes (20): FIXTURES, CompletionResult, mock, Provider, ResolveOpts, config, schema, Opts (+12 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (41): eslint, eslint-config-next, next, dependencies, next, react, react-dom, tailwindcss-animate (+33 more)

### Community 5 - "bugfix.md"
Cohesion: 0.14
Nodes (13): 1. Diagnosis, 2. Fix, 3. Validation, 4. Learning Record, BUG FIX PROMPT TEMPLATE, ERROR, FINAL CHECK, LOCATION (+5 more)

### Community 6 - "NUCLEUS 2.0 — CONTEXT TRANSFER"
Cohesion: 0.14
Nodes (13): 1. VISION (One Sentence), 2. DIFFERENTIATION (What Separates It From Competitors), 3. CHARACTER (8 Principles — Code + UX + Communication), 4. TECHNICAL ARCHITECTURE (5 Layers), 5. ROADMAP, 6. CRITICAL DECISIONS (Lessons From Nucleus 1.0), 7. CURRENT STATUS, 8. TOMORROW'S GOAL (2026-07-26) (+5 more)

### Community 8 - "ERROR LOG #[NUMBER]"
Cohesion: 0.22
Nodes (8): Cause, ERROR LOG #[NUMBER], Impact, Prevention, Problem, Related Decision, Related Prompt Template, Solution

### Community 9 - "include"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 10 - "TOMORROW_PLAN.md"
Cohesion: 0.33
Nodes (5): 5–5–10–5–5 EXECUTION FRAMEWORK, Nucleus 2.0 Faz 1, Gün 1, OTURUM BAŞLANGICI (İlk Mesaj — Claude'a Kopyala), SESSION GOAL, YARININ PLANI — 2026-07-26

### Community 11 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 16 - "page.tsx"
Cohesion: 0.05
Nodes (54): createVenture(), DEFAULT_CAPS, Home(), migrateLegacyIdeas(), Spend, titleFromIdea(), ZERO_SPEND, Breakdown (+46 more)

### Community 18 - "feature.md"
Cohesion: 0.09
Nodes (22): 1. PLAN, 2. RISK ANALYSIS, 3. IMPLEMENTATION, 4. QUALITY REVIEW, 5. FUTURE MAINTAINABILITY CHECK, 🏋️ Athlete — Iterative, Code Quality, CONTEXT (+14 more)

### Community 19 - "START_HERE.md"
Cohesion: 0.33
Nodes (5): For Claude — every session, For the founder, Running it, START HERE, The 5–5–10–5–5 rhythm

### Community 20 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 21 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 22 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 23 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 24 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 27 - "Session Learning Log"
Cohesion: 0.14
Nodes (13): 2026-07-26 — Phase 1, Day 1: Dashboard Foundation, 2026-07-26 — Phase 1, Day 1: New Idea Flow (mock), 2026-07-27 — Phase 1, Day 2: Continue/Save/Saved Ideas, 2026-07-28 — Plan Phase 00: Ground Truth, 2026-07-28 — Plan Phase 01: Domain & Storage, 2026-07-28 — Plan Phase 02: AI Gateway, 2026-07-28 — Plan Phase 03: Real Validation, 2026-07-28 — Plan Phase 04: Venture Workspace (+5 more)

### Community 29 - ".claude/CLAUDE.md"
Cohesion: 0.33
Nodes (5): Invariants — do not break these, Nucleus 2.0, Rules, Skills, What Nucleus is (and isn't)

### Community 32 - "include"
Cohesion: 0.08
Nodes (23): APRIL-JUNE 2027, CRITICAL CHECKPOINTS, DAILY RITUAL (Every Day), Daily / Weekly / Monthly Roadmap, DECEMBER 2026, JANUARY-MARCH 2027, LAST UPDATE, MONTHLY RITUAL (Every Month) (+15 more)

### Community 33 - "NewIdeaFlow.tsx"
Cohesion: 0.05
Nodes (57): BuildSpecArtifact(), CompetitorsArtifact(), CopyForControl(), Format, FORMATS, render(), ArtifactRenderer(), REGENERATABLE (+49 more)

### Community 34 - "Automated Content Generation System"
Cohesion: 0.29
Nodes (6): Automated Content Generation System, CONTENT ENGINE, Directory Structure, How It Works, Manual Intervention Needed, No Manual Intervention Needed

### Community 35 - "Nucleus 2.0 — Day 2: Ideas That Stick"
Cohesion: 0.33
Nodes (5): Next Step, Nucleus 2.0 — Day 2: Ideas That Stick, Problem & Solution, Screenshot / Demo, What Was Built

### Community 36 - "Nucleus 2.0 — Day {{DAY_NUMBER}}: {{TITLE}}"
Cohesion: 0.33
Nodes (5): Next Step, Nucleus 2.0 — Day {{DAY_NUMBER}}: {{TITLE}}, Problem & Solution, Technical Detail (Optional), What Was Built

### Community 39 - "Run the Nucleus 2.0 dashboard"
Cohesion: 0.29
Nodes (6): 1. Start the dev server, 2. Drive it, 3. Adapt for a new feature, Constraints (don't violate these), Gotchas, Run the Nucleus 2.0 dashboard

### Community 40 - "Feature: Idea Export (JSON + CSV)"
Cohesion: 0.33
Nodes (5): Context, Feature: Idea Export (JSON + CSV), Goal, JSON Export, Requirements

### Community 42 - "writeCollection"
Cohesion: 0.06
Nodes (34): ALL_COLLECTIONS, POST(), BodySchema, AiCall, AiCallSchema, ArtifactSchema, BuildTaskSchema, NucleusEventSchema (+26 more)

### Community 43 - "budget.ts"
Cohesion: 0.15
Nodes (19): GET(), GET(), CapsSchema, GET(), PATCH(), PatchSchema, BudgetOpts, DEFAULT_CAPS (+11 more)

### Community 44 - "gateway.ts"
Cohesion: 0.13
Nodes (26): POST(), BodySchema, POST(), Caps, CacheEntry, cacheKey(), CacheOpts, clearCache() (+18 more)

### Community 45 - "Plan of record"
Cohesion: 0.08
Nodes (26): 2026-07-28 · Planning · BYOK, always, 2026-07-28 · Planning · JSON files, not Supabase, 2026-07-28 · Planning · Mock adapters are permanent, 2026-07-28 · Planning · Venture copilot, not codegen, 2026-07-29 · Build Stage · Agent brief tested before shipping, 2026-07-29 · Build Stage · Launch gating lives in the route, not a workflow engine, 2026-07-29 · Build Stage · One milestone equals one task, 2026-07-30 · Launch Stage · Copy is structured, HTML is templated (+18 more)

### Community 46 - "THE ANSWER"
Cohesion: 0.25
Nodes (8): 1. What Nucleus actually is, 2. The honest scope correction, 4. The domain model, 5. Reliability: what "won't break" means here, 6. Scalability: what actually needs to scale, 7. Marketing is a subsystem, not a chore, 8. Summary, THE ANSWER

### Community 47 - "Steps"
Cohesion: 0.13
Nodes (14): 1. Domain (`src/lib/domain.ts`), 2. Stage machine (`src/lib/stages.ts`), 3. The store (`src/server/db/store.ts`), 4. Repositories (`src/server/db/repositories/`), 5. Events (`src/server/events.ts`), 6. API routes, 7. Migrate off localStorage, 8. Wire the existing dashboard (+6 more)

### Community 48 - "PEERLIST BUILD-IN-PUBLIC PLAYBOOK"
Cohesion: 0.14
Nodes (13): Angles already assigned per phase, PEERLIST BUILD-IN-PUBLIC PLAYBOOK, Post A — SHIP: "here's what now works", Post B — LESSON: "here's a problem I hit and how I solved it", Pre-publish checklist, Publish date (required on every post), Rules that make the difference, Template — LESSON (+5 more)

### Community 49 - "Steps"
Cohesion: 0.14
Nodes (13): 1. Install the test harness, 2. The verify gate, 3. Validated config, 4. Boundary tests, 5. CI, 6. Repo hygiene, 7. Sanity test, Acceptance (+5 more)

### Community 50 - "Steps"
Cohesion: 0.14
Nodes (13): 1. Model table (`src/server/ai/models.ts`), 2. Budget (`src/server/ai/budget.ts`), 3. Provider (`src/server/ai/provider.ts`), 4. Task registry (`src/server/ai/tasks/index.ts`), 5. Cache (`src/server/ai/cache.ts`), 6. `runTask` (`src/server/ai/gateway.ts`), 7. Health route, Acceptance (+5 more)

### Community 51 - "Steps"
Cohesion: 0.14
Nodes (13): 1. Delete `mock-data.ts`, 2. Venture workspace — `src/app/ventures/[id]/page.tsx`, 3. Artifact renderers — `src/components/venture/artifacts/`, 4. Stage timeline — `src/components/venture/StageTimeline.tsx`, 5. Dashboard rebuild — `src/app/page.tsx`, 6. Wire up export, 7. Responsive + dark mode pass, Acceptance (+5 more)

### Community 52 - "Steps"
Cohesion: 0.14
Nodes (13): 1. First-run experience, 2. Accessibility pass, 3. Performance, 4. Documentation, 5. One-command setup, 6. Launch assets, 7. Final honesty pass, Acceptance (+5 more)

### Community 53 - "Steps"
Cohesion: 0.15
Nodes (12): 1. The verdict model, 2. `validate-idea` task, 3. `analyze-competitors` task, 4. Wire the New Idea flow, 5. Handle failure in the UI, 6. Delete the mock, Acceptance, Peerlist posts (+4 more)

### Community 54 - "Steps"
Cohesion: 0.15
Nodes (12): 1. Settings page — `src/app/settings/page.tsx`, 2. BYOK key handling, 3. Caps, 4. Spend breakdown, 5. Degradation UX, 6. Demo mode banner, Acceptance, Peerlist posts (+4 more)

### Community 55 - "Steps"
Cohesion: 0.15
Nodes (12): 1. Event selection, 2. `write-buildinpublic` task, 3. Voice calibration, 4. Drafts inbox — `/content`, 5. Self-documentation mode, 6. Migrate the existing protocol, Acceptance, Peerlist posts (+4 more)

### Community 56 - "Steps"
Cohesion: 0.15
Nodes (12): 1. Error capture, 2. Mistake DB as data, 3. Recovery paths, 4. Health checks — `/api/health` (extend), 5. Cost anomaly detection, 6. Automated vision-drift check, Acceptance, Peerlist posts (+4 more)

### Community 57 - "TARGET ARCHITECTURE"
Cohesion: 0.18
Nodes (11): Budget, Directory layout, Domain model, Model tiers, Module boundaries (enforced by test, not by discipline), Provider abstraction, Stage transitions, Storage (+3 more)

### Community 58 - "PHASE 06 — PLANNING STAGE"
Cohesion: 0.17
Nodes (11): 1. `plan-venture` task, 2. `scope-mvp` task, 3. Stage transition, 4. Renderers, 5. Regenerate with feedback, Acceptance, Peerlist posts, PHASE 06 — PLANNING STAGE (+3 more)

### Community 59 - "PHASE 07 — BUILD STAGE & THE HANDOFF"
Cohesion: 0.17
Nodes (11): 1. Tasks from milestones, 2. `generate-build-spec` task, 3. Three export formats, 4. Build stage UI, 5. External build link, Acceptance, Peerlist posts, PHASE 07 — BUILD STAGE & THE HANDOFF (+3 more)

### Community 60 - "PHASE 08 — LAUNCH STAGE"
Cohesion: 0.17
Nodes (11): 1. `write-landing-page` task, 2. Template — `src/server/launch/template.ts`, 3. Deploy adapter — `src/server/deploy/`, 4. Preview before deploy, 5. Launch checklist, Acceptance, Peerlist posts, PHASE 08 — LAUNCH STAGE (+3 more)

### Community 61 - "PHASE 09 — GROWTH STAGE"
Cohesion: 0.17
Nodes (11): 1. `write-content-calendar` task, 2. `write-post` task, 3. Metrics — manual, honest, 4. Growth view, 5. Weekly review, Acceptance, Peerlist posts, PHASE 09 — GROWTH STAGE (+3 more)

### Community 62 - "CONVENTIONS & DEFINITION OF DONE"
Cohesion: 0.20
Nodes (10): Code style, CONVENTIONS & DEFINITION OF DONE, Definition of Done, Dependencies, Error handling, Git, `npm run verify`, Prompts (+2 more)

### Community 63 - "Execute a Nucleus 2.0 phase"
Cohesion: 0.29
Nodes (6): Before anything else, Execute a Nucleus 2.0 phase, Finishing a phase, Gotchas already paid for, Non-negotiable, The loop

### Community 64 - "NUCLEUS 2.0 — EXECUTION PLAN"
Cohesion: 0.29
Nodes (6): Hard rules, NUCLEUS 2.0 — EXECUTION PLAN, Phase map, Read order (first session only), Session-end protocol, The operating loop

### Community 65 - "boundaries.test.ts"
Cohesion: 0.33
Nodes (3): contents, files, SRC_DIR

### Community 66 - "BACKLOG"
Cohesion: 0.40
Nodes (4): BACKLOG, Deferred with a known trigger, From the original docs, Rejected outright, with reasoning

### Community 67 - "regenerate/route.ts"
Cohesion: 0.33
Nodes (7): POST(), statusFor(), BodySchema, POST(), statusFor(), generateLandingPage(), regenerateArtifact()

### Community 68 - "[id]/route.ts"
Cohesion: 0.12
Nodes (10): Modal(), NewIdeaCard(), Failure, failureCopy, NewIdeaFlow(), Step, recommendationBadge, recommendationLabel (+2 more)

### Community 69 - "build-spec/route.ts"
Cohesion: 0.22
Nodes (9): How it works, License, Nucleus 2.0, Project status & development, Quickstart, Security, What Nucleus is — and isn't, What works today (+1 more)

### Community 88 - "validateAndAdvance.ts"
Cohesion: 0.33
Nodes (6): 3.1 One chokepoint for all AI traffic, 3.2 The budget is a pre-flight guard, not a report, 3.3 Every AI output is schema-validated at the boundary, 3.4 The event log is the source of truth for everything narrative, 3.5 Local-first storage, adapters at the edges, 3. The five engineering decisions that matter

### Community 89 - "planAndAdvance.ts"
Cohesion: 0.06
Nodes (36): BodySchema, POST(), statusFor(), POST(), statusFor(), POST(), statusFor(), GET() (+28 more)

### Community 90 - "domain.ts"
Cohesion: 0.33
Nodes (5): Known dependency advisories, Reporting a vulnerability, Security, Security model, Supported versions

## Knowledge Gaps
- **554 isolated node(s):** `{ chromium }`, `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name` (+549 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `writeCollection()` connect `writeCollection` to `planAndAdvance.ts`, `gateway.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Plan` connect `NewIdeaFlow.tsx` to `page.tsx`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `{ chromium }`, `next/core-web-vitals`, `next/typescript` to the rest of the system?**
  _554 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ABSOLUTE RULES` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `vision-check.md` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0707070707070707 - nodes in this community are weakly interconnected._