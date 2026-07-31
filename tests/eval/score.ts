// Pure scoring for the calibration harness. No I/O, no AI, no clock.
//
// Split out from run.eval.ts on purpose: these functions encode the claims
// the project will publish about itself, so they are unit-tested for free in
// the normal suite (tests/eval/score.test.ts) rather than only being
// exercised by a run that costs real money.

export type Outcome = "succeeded" | "failed" | "unknown";
export type Contamination = "high" | "medium" | "low";

export interface EvalIdea {
  id: string;
  idea: string;
  actualOutcome: Outcome;
  contamination: Contamination;
  note: string;
}

/** One idea's results across N runs. `scores` has one entry per run. */
export interface IdeaResult {
  id: string;
  actualOutcome: Outcome;
  contamination: Contamination;
  scores: number[];
  /** The band from run 1, after reconcileVerdict. */
  recommendation: "build" | "refine" | "kill";
}

export interface Metrics {
  /** Of ideas scored >= 70, the fraction that actually succeeded. */
  calibration: number | null;
  calibrationN: number;
  /** Of ideas recommended `kill`, the fraction that actually failed. */
  killPrecision: number | null;
  killPrecisionN: number;
  /**
   * Of ideas that actually succeeded, the fraction we killed. The Airbnb
   * number. Reported separately because kill precision can be made to look
   * excellent by never killing anything, and this is the metric that
   * catches that.
   */
  falseKillRate: number | null;
  falseKillRateN: number;
  /** Mean per-idea standard deviation of score across runs. */
  meanScoreStdDev: number | null;
  /** Worst per-idea standard deviation. One unstable verdict is the story. */
  maxScoreStdDev: number | null;
  /** Ideas whose band changed between runs. Instability that actually matters. */
  bandFlips: string[];
  /** Ideas considered (unknown outcomes still count toward stability). */
  n: number;
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population standard deviation. A single run has no spread, so 0. */
export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * The product's own band logic, duplicated here deliberately rather than
 * imported from src/server/ai/tasks/validate-idea.ts.
 *
 * If the eval imported the implementation, a change to the bands would move
 * the measuring stick and the yardstick together, and the harness would
 * report no regression. The eval must be able to disagree with the product.
 */
export function band(score: number): "build" | "refine" | "kill" {
  if (score < 40) return "kill";
  if (score < 70) return "refine";
  return "build";
}

function ratio(hits: number, total: number): number | null {
  return total === 0 ? null : hits / total;
}

export function computeMetrics(results: IdeaResult[]): Metrics {
  const known = results.filter((r) => r.actualOutcome !== "unknown");

  const highScorers = known.filter((r) => mean(r.scores) >= 70);
  const killed = known.filter((r) => r.recommendation === "kill");
  const succeeded = known.filter((r) => r.actualOutcome === "succeeded");

  const stdDevs = results.map((r) => stdDev(r.scores));
  const multiRun = results.some((r) => r.scores.length > 1);

  const bandFlips = results
    .filter((r) => new Set(r.scores.map(band)).size > 1)
    .map((r) => r.id);

  return {
    calibration: ratio(
      highScorers.filter((r) => r.actualOutcome === "succeeded").length,
      highScorers.length
    ),
    calibrationN: highScorers.length,
    killPrecision: ratio(
      killed.filter((r) => r.actualOutcome === "failed").length,
      killed.length
    ),
    killPrecisionN: killed.length,
    falseKillRate: ratio(
      succeeded.filter((r) => r.recommendation === "kill").length,
      succeeded.length
    ),
    falseKillRateN: succeeded.length,
    meanScoreStdDev: multiRun ? mean(stdDevs) : null,
    maxScoreStdDev: multiRun ? Math.max(...stdDevs) : null,
    bandFlips,
    n: results.length,
  };
}

const pct = (x: number | null) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);
const num = (x: number | null) => (x === null ? "n/a" : x.toFixed(1));

/**
 * Renders a metrics block. Called twice by the runner: once over everything,
 * once over the low+medium-contamination subset only.
 */
export function formatMetrics(label: string, m: Metrics): string {
  return [
    `### ${label}`,
    "",
    `| Metric | Value | Denominator |`,
    `|---|---|---|`,
    `| Calibration (scored 70+, actually succeeded) | ${pct(m.calibration)} | ${m.calibrationN} |`,
    `| Kill precision (killed, actually failed) | ${pct(m.killPrecision)} | ${m.killPrecisionN} |`,
    `| False kill rate (succeeded, we killed) | ${pct(m.falseKillRate)} | ${m.falseKillRateN} |`,
    `| Mean score std dev across runs | ${num(m.meanScoreStdDev)} | ${m.n} |`,
    `| Max score std dev across runs | ${num(m.maxScoreStdDev)} | ${m.n} |`,
    `| Ideas whose band flipped between runs | ${m.bandFlips.length} | ${m.n} |`,
    m.bandFlips.length ? `\nBand flips: ${m.bandFlips.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
