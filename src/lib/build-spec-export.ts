import type { BuildSpec } from "./domain";

export interface BuildSpecContext {
  ventureTitle: string;
  stack?: { recommendation: string; reasoning: string };
}

export function buildSpecToMarkdown(spec: BuildSpec, ctx: BuildSpecContext): string {
  const stories = spec.userStories
    .map(
      (s) =>
        `### As ${s.as}\nI want ${s.iWant}, so that ${s.soThat}.\n\nAcceptance criteria:\n${s.acceptance
          .map((a) => `- ${a}`)
          .join("\n")}`
    )
    .join("\n\n");
  const dataModel = spec.dataModel.map((e) => `- **${e.entity}**: ${e.fields.join(", ")}`).join("\n");
  const screens = spec.screens.map((s) => `- **${s.name}** -- ${s.purpose}\n  - ${s.elements.join("\n  - ")}`).join("\n");
  const outOfScope = spec.outOfScope.map((s) => `- ${s}`).join("\n");

  return `# Build spec -- ${ctx.ventureTitle}

## Summary
${spec.summary}
${ctx.stack ? `\n## Stack\n${ctx.stack.recommendation} -- ${ctx.stack.reasoning}\n` : ""}
## User stories
${stories}

## Data model
${dataModel}

## Screens
${screens}

## Out of scope
${outOfScope}

## First commit
${spec.firstCommit}
`;
}

// Formatted as a build instruction for a coding agent -- the format that
// matters most. Test it by pasting a real one into a coding-agent session
// before shipping the post; see docs/plan/PHASE-07-build-stage.md.
export function buildSpecToAgentBrief(spec: BuildSpec, ctx: BuildSpecContext): string {
  const stories = spec.userStories
    .map((s, i) => `${i + 1}. As ${s.as}, I want ${s.iWant}, so that ${s.soThat}.\n   Acceptance:\n${s.acceptance.map((a) => `   - ${a}`).join("\n")}`)
    .join("\n\n");
  const dataModel = spec.dataModel.map((e) => `- ${e.entity}(${e.fields.join(", ")})`).join("\n");
  const screens = spec.screens.map((s) => `- ${s.name}: ${s.purpose} [${s.elements.join(", ")}]`).join("\n");
  const outOfScope = spec.outOfScope.map((s) => `- ${s}`).join("\n");

  return `# ${ctx.ventureTitle} -- build brief

You are building the MVP described below. Follow the scope exactly: build
everything in "Must build," build nothing in "Out of scope," and start with
"First commit."

## What this is
${spec.summary}
${ctx.stack ? `\n## Recommended stack\n${ctx.stack.recommendation}\nWhy: ${ctx.stack.reasoning}\n` : ""}
## Must build (user stories with acceptance criteria)
${stories}

## Data model
${dataModel}

## Screens
${screens}

## Out of scope -- do not build these
${outOfScope}

## First commit
${spec.firstCommit}

If anything above is ambiguous, prefer the simplest interpretation that
satisfies the acceptance criteria. Do not add features not listed here.
`;
}

// A single paste-ready block for Lovable / v0 / Bolt -- prose, not headers,
// since these tools work best from a flowing prompt.
export function buildSpecToPrompt(spec: BuildSpec, ctx: BuildSpecContext): string {
  const stories = spec.userStories
    .map((s) => `As ${s.as}, I want ${s.iWant}, so that ${s.soThat}. It's done when: ${s.acceptance.join("; ")}.`)
    .join(" ");
  const dataModel = spec.dataModel.map((e) => `${e.entity} (${e.fields.join(", ")})`).join("; ");
  const screens = spec.screens.map((s) => `${s.name} (${s.purpose}: ${s.elements.join(", ")})`).join("; ");

  return `Build "${ctx.ventureTitle}": ${spec.summary}${
    ctx.stack ? ` Use ${ctx.stack.recommendation}.` : ""
  } Data model: ${dataModel}. Screens: ${screens}. User stories: ${stories} Start with: ${spec.firstCommit}. Do NOT build: ${spec.outOfScope.join(
    "; "
  )}.`;
}
