# Graph Report - nucleus-2.0  (2026-07-25)

## Corpus Check
- 18 files · ~3,938 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 171 nodes · 153 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b14ae1fa`
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
- "Never Make the Same Mistake Twice" List
- ERROR LOG #[NUMBER]
- include
- TOMORROW_PLAN.md
- extends
- README.md
- layout.tsx
- next.config.mjs
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `NUCLEUS 2.0 — CONTEXT TRANSFER` - 12 edges
3. `"Never Make the Same Mistake Twice" List` - 10 edges
4. `ERROR LOG #[NUMBER]` - 8 edges
5. `ABSOLUTE RULES` - 7 edges
6. `EVALUATION CRITERIA` - 6 edges
7. `scripts` - 5 edges
8. `include` - 5 edges
9. `SESSION END (Always Final Message)` - 5 edges
10. `REQUIRED PROCESS` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "ABSOLUTE RULES"
Cohesion: 0.11
Nodes (18): 1. What did we accomplish?, 2. What did we learn?, 3. What is the next step?, 4. Quality Score, 5-5-10-5-5 ITERATION RULE, ABSOLUTE RULES, Claude Collaboration Protocol, CORE WORKING PRINCIPLE (+10 more)

### Community 1 - "compilerOptions"
Cohesion: 0.11
Nodes (18): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+10 more)

### Community 2 - "vision-check.md"
Cohesion: 0.12
Nodes (16): 1. Vision Alignment, 2. User Value, 3. AI-Native Principle, 4. Complexity Check, 5. Scope Check, Alignment Score, EVALUATION CRITERIA, FINAL QUESTION (+8 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+9 more)

### Community 4 - "package.json"
Cohesion: 0.12
Nodes (15): next, dependencies, next, react, react-dom, name, private, scripts (+7 more)

### Community 5 - "bugfix.md"
Cohesion: 0.14
Nodes (13): 1. Diagnosis, 2. Fix, 3. Validation, 4. Learning Record, BUG FIX PROMPT TEMPLATE, ERROR, FINAL CHECK, LOCATION (+5 more)

### Community 6 - "NUCLEUS 2.0 — CONTEXT TRANSFER"
Cohesion: 0.15
Nodes (12): 1. VISION (One Sentence), 2. DIFFERENTIATION (What Separates It From Competitors), 3. CHARACTER (8 Principles — Code + UX + Communication), 4. TECHNICAL ARCHITECTURE (5 Layers), 5. ROADMAP, 6. CRITICAL DECISIONS (Lessons From Nucleus 1.0), 7. CURRENT STATUS, 8. TOMORROW'S GOAL (2026-07-26) (+4 more)

### Community 7 - ""Never Make the Same Mistake Twice" List"
Cohesion: 0.17
Nodes (11): 1. OBSESSION WITH TECHNICAL PERFECTION, 2. DELAYING MARKETING UNTIL THE END, 3. SILENT DEVELOPMENT, 4. INCONSISTENT PROMPTS, 5. EXCESSIVE AUTHORITY (Given to Claude), 6. SHOWING TECHNICAL DETAILS TO USERS, 7. LOSS OF VISION, 8. NO LEARNING LOOP (+3 more)

### Community 8 - "ERROR LOG #[NUMBER]"
Cohesion: 0.22
Nodes (8): Cause, ERROR LOG #[NUMBER], Impact, Prevention, Problem, Related Decision, Related Prompt Template, Solution

### Community 9 - "include"
Cohesion: 0.25
Nodes (7): next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude, include

### Community 10 - "TOMORROW_PLAN.md"
Cohesion: 0.33
Nodes (5): 5–5–10–5–5 EXECUTION FRAMEWORK, Nucleus 2.0 Faz 1, Gün 1, OTURUM BAŞLANGICI (İlk Mesaj — Claude'a Kopyala), SESSION GOAL, YARININ PLANI — 2026-07-26

### Community 11 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 12 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **118 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `compilerOptions` connect `compilerOptions` to `include`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ABSOLUTE RULES` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `vision-check.md` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._