import * as ventures from "../db/repositories/ventures";
import * as artifacts from "../db/repositories/artifacts";
import { runTask } from "../ai/gateway";
import { reconcileVerdict, type Verdict } from "../ai/tasks/validate-idea";
import type { Competitors } from "../ai/tasks/analyze-competitors";
import type { Provider } from "../ai/provider";
import { recordEvent } from "../events";
import type { Venture } from "@/lib/domain";

// Competitor analysis is frontier-tier -- don't spend that on an idea the
// system just told the user to kill. See docs/plan/PHASE-03-real-validation.md.
const COMPETITOR_ANALYSIS_MIN_SCORE = 40;

export type ValidateAndAdvanceResult =
  | { ok: true; venture: Venture; verdict: Verdict; competitors: Competitors | null }
  | { ok: false; reason: "budget_exceeded" | "invalid_output" | "provider_error"; message: string };

interface Opts {
  baseDir?: string;
  provider?: Provider;
}

// Runs validate-idea, conditionally runs analyze-competitors, and advances
// the venture captured -> validated. Extracted out of the API route so the
// orchestration logic (in particular the score-gated competitor call) is
// directly unit-testable with a stub provider, the same pattern already used
// for the gateway and repositories.
export async function validateAndAdvance(venture: Venture, opts?: Opts): Promise<ValidateAndAdvanceResult> {
  const verdictResult = await runTask<Verdict>(
    "validate-idea",
    { idea: venture.description },
    { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
  );
  if (!verdictResult.ok) return verdictResult;

  const verdict = reconcileVerdict(verdictResult.data);
  await artifacts.create(
    {
      ventureId: venture.id,
      kind: "validation",
      stage: "captured",
      content: verdict,
      model: "validate-idea",
      costUsd: verdictResult.costUsd,
    },
    { baseDir: opts?.baseDir }
  );
  await recordEvent(
    "venture.validated",
    `Validated "${venture.title}" -- scored ${verdict.score}/100 (${verdict.recommendation}).`,
    { ventureId: venture.id, baseDir: opts?.baseDir }
  );

  let competitors: Competitors | null = null;
  if (verdict.score >= COMPETITOR_ANALYSIS_MIN_SCORE) {
    const competitorsResult = await runTask<Competitors>(
      "analyze-competitors",
      { idea: venture.description },
      { ventureId: venture.id, baseDir: opts?.baseDir, provider: opts?.provider }
    );
    if (competitorsResult.ok) {
      competitors = competitorsResult.data;
      await artifacts.create(
        {
          ventureId: venture.id,
          kind: "competitors",
          stage: "captured",
          content: competitors,
          model: "analyze-competitors",
          costUsd: competitorsResult.costUsd,
        },
        { baseDir: opts?.baseDir }
      );
    }
    // A failed competitor lookup doesn't invalidate an otherwise-good
    // verdict -- the venture still advances, just without that artifact.
  }

  await ventures.update(venture.id, { verdictScore: verdict.score }, { baseDir: opts?.baseDir });
  const updated = await ventures.advance(venture.id, "validated", { baseDir: opts?.baseDir });

  return { ok: true, venture: updated, verdict, competitors };
}
