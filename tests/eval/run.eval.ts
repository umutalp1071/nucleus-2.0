import fs from "node:fs/promises";
import path from "node:path";
import { it, expect } from "vitest";
import { runTask } from "@/server/ai/gateway";
import { reconcileVerdict, type Verdict } from "@/server/ai/tasks/validate-idea";
import {
  computeMetrics,
  formatMetrics,
  type EvalIdea,
  type IdeaResult,
} from "./score";

// The calibration harness. Costs REAL MONEY -- it is not part of
// `npm run verify` and never runs in CI. Trigger it deliberately:
//
//   npm run eval                 # full set, 3 runs each
//   EVAL_RUNS=1 npm run eval     # cheap smoke pass, no stability number
//   EVAL_LIMIT=5 npm run eval    # first 5 ideas only
//
// Run through vitest rather than adding `tsx` as a dependency: vitest is
// already installed, already resolves the `@` alias, and already runs
// TypeScript. A new devDependency for a job an existing tool does would
// need a Dependency Ledger row in docs/plan/PROGRESS.md to earn nothing.

const RUNS = Number(process.env.EVAL_RUNS ?? 3);
const LIMIT = process.env.EVAL_LIMIT ? Number(process.env.EVAL_LIMIT) : Infinity;
// Both paths are resolved from the project root rather than from this file's
// own directory: vitest always runs from the root, and `__dirname` /
// `import.meta.dirname` availability depends on module-resolution settings
// that could change under us.
const IDEAS_PATH = path.join(process.cwd(), "tests", "eval", "ideas.json");
const REPORT_PATH = path.join(process.cwd(), "docs", "eval", "calibration-report.md");

interface IdeaFile {
  ideas: EvalIdea[];
}

it(
  "measures validate-idea against historical outcomes",
  { timeout: 30 * 60 * 1000 },
  async () => {
    const raw = await fs.readFile(IDEAS_PATH, "utf-8");
    const ideas = (JSON.parse(raw) as IdeaFile).ideas.slice(0, LIMIT);
    expect(ideas.length).toBeGreaterThanOrEqual(20);

    const results: IdeaResult[] = [];
    let totalCost = 0;
    let modelId = "";
    let promptVersion = "";

    for (const entry of ideas) {
      const scores: number[] = [];
      let recommendation: IdeaResult["recommendation"] | null = null;

      for (let run = 0; run < RUNS; run++) {
        const res = await runTask<Verdict>(
          "validate-idea",
          { idea: entry.idea },
          // bypassCache is what makes the stability number real: without it,
          // runs 2..n are served from run 1 and variance is always 0.
          { bypassCache: true }
        );

        if (!res.ok) {
          throw new Error(
            `[${entry.id}] run ${run + 1} failed: ${res.reason}. ` +
              `Spent $${totalCost.toFixed(4)} before stopping.`
          );
        }

        // A demo-mode run scores the fixture, not the model. The fixture is
        // a fixed verdict, so every number below would be a fabrication.
        // Refuse loudly rather than write a confident, meaningless report.
        if (res.demo) {
          throw new Error(
            "No provider key configured -- the harness would be scoring the " +
              "mock fixture. Set a key in Settings and re-run."
          );
        }

        const verdict = reconcileVerdict(res.data);
        scores.push(verdict.score);
        recommendation ??= verdict.recommendation;
        totalCost += res.costUsd;
        modelId = res.modelId;
        promptVersion = res.promptVersion;

        process.stdout.write(
          `${entry.id} run ${run + 1}/${RUNS}: ${verdict.score} ${verdict.recommendation}\n`
        );
      }

      results.push({
        id: entry.id,
        actualOutcome: entry.actualOutcome,
        contamination: entry.contamination,
        scores,
        recommendation: recommendation!,
      });
    }

    const clean = results.filter((r) => r.contamination !== "high");
    const overall = computeMetrics(results);
    const uncontaminated = computeMetrics(clean);

    const report = [
      "# CALIBRATION REPORT",
      "",
      `**Generated:** ${new Date().toISOString().slice(0, 10)} · `,
      `**Model:** \`${modelId}\` · **Prompt version:** \`${promptVersion}\` · `,
      `**Ideas:** ${results.length} · **Runs each:** ${RUNS} · `,
      `**Cost of this report:** $${totalCost.toFixed(4)}`,
      "",
      "This measures whether Nucleus's `kill` verdict is worth anything. The",
      "numbers below are whatever they are. An unflattering number published",
      "is worth more than a flattering number withheld -- no competitor in",
      "this category publishes any falsifiable accuracy claim at all.",
      "",
      formatMetrics("All ideas", overall),
      "",
      formatMetrics("Excluding high-contamination ideas", uncontaminated),
      "",
      "## How to read this",
      "",
      "**Contamination is the main limitation.** Famous cases are in the",
      "model's training data. When it scores the air-mattress idea highly it",
      "may be recalling the outcome rather than judging the pitch. The second",
      "table drops every idea marked `high` and is the more honest number,",
      "at the cost of a smaller denominator.",
      "",
      "**The three accuracy numbers are reported together because no two of",
      "them can be gamed at once.** A validator that never kills anything has",
      "an undefined kill precision and a 0% false kill rate, and gets punished",
      "on calibration. One that kills everything inverts that. Only genuine",
      "discrimination moves all three.",
      "",
      "**Stability is the one that decides whether any of this means",
      "anything.** A verdict that swings 25 points between identical runs is a",
      "random number generator with good prose, and its calibration score is",
      "an artifact of sampling.",
      "",
      "**The set is small.** Twenty-odd ideas cannot support a confidence",
      "interval. Treat every percentage here as directional.",
      "",
      "## Per-idea results",
      "",
      "| id | outcome | contamination | scores | band |",
      "|---|---|---|---|---|",
      ...results.map(
        (r) =>
          `| ${r.id} | ${r.actualOutcome} | ${r.contamination} | ${r.scores.join(", ")} | ${r.recommendation} |`
      ),
      "",
    ].join("\n");

    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, report, "utf-8");

    process.stdout.write(`\n${formatMetrics("Summary", overall)}\n`);
    process.stdout.write(`\nTotal cost: $${totalCost.toFixed(4)}\n`);
    process.stdout.write(`Report: ${REPORT_PATH}\n`);
  }
);
