import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import { FIXTURES } from "@/server/ai/fixtures";
import type { Plan } from "@/lib/domain";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-plan-test-"));
  baseDir = tmpDir;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function stubProvider(responses: Array<CompletionResult | Error>): Provider {
  let call = 0;
  const complete = vi.fn(async (): Promise<CompletionResult> => {
    const next = responses[Math.min(call, responses.length - 1)];
    call++;
    if (next instanceof Error) throw next;
    return next;
  });
  return { complete };
}

const planResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["plan-venture"]),
  promptTokens: 100,
  completionTokens: 100,
};
const mvpResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["scope-mvp"]),
  promptTokens: 100,
  completionTokens: 100,
};

async function validatedVenture(baseDir: string) {
  return ventures.create({ title: "Idea", description: "an idea worth planning" }, { baseDir })
    .then((v) => ventures.advance(v.id, "validated", { baseDir }));
}

describe("planAndAdvance", () => {
  it("advances a validated venture to planned with both artifacts saved", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const venture = await validatedVenture(baseDir);
    const provider = stubProvider([planResponse, mvpResponse]);

    const result = await planAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.venture.stage).toBe("planned");
      expect(result.plan.killCriteria.length).toBeGreaterThan(0);
      expect(result.mvpScope.milestones.length).toBeGreaterThanOrEqual(3);
    }

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.some((a) => a.kind === "plan")).toBe(true);
    expect(saved.some((a) => a.kind === "mvp_scope")).toBe(true);
  });

  it("extracts a Prediction from Plan.successMetric -- no extra AI call (docs/reviews/2026-07-30-stack-position.md §5.2)", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const decisions = await import("@/server/db/repositories/decisions");
    const predictions = await import("@/server/db/repositories/predictions");

    const venture = await validatedVenture(baseDir);
    const provider = stubProvider([planResponse, mvpResponse]);

    const result = await planAndAdvance(venture, { baseDir, provider });
    expect(result.ok).toBe(true);

    const preds = await predictions.listByVenture(venture.id, { baseDir });
    expect(preds).toHaveLength(1);
    expect(preds[0].metric).toBe((FIXTURES["plan-venture"] as Plan).successMetric.metric);
    expect(preds[0].source).toBe("plan.successMetric");
    expect(preds[0].status).toBe("open");

    const planDecision = (await decisions.listByVenture(venture.id, { baseDir })).find(
      (d) => d.task === "plan-venture"
    )!;
    expect(preds[0].decisionId).toBe(planDecision.id);

    // The provider was called exactly twice (plan-venture, scope-mvp) --
    // extraction must not have triggered a third call.
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("keeps the plan artifact and leaves the venture at validated if scope-mvp is blocked", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const venture = await validatedVenture(baseDir);

    // plan-venture succeeds; scope-mvp fails twice (invalid JSON both attempts,
    // exhausting the gateway's one repair retry) -- simulates any failure mode
    // after the first artifact is already saved.
    const provider = stubProvider([planResponse, { text: "not json", promptTokens: 5, completionTokens: 5 }]);

    const result = await planAndAdvance(venture, { baseDir, provider });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_output");
      expect(result.message).not.toMatch(/model|token|claude|llama|http/i);
    }

    // The plan artifact from the first (successful) call must survive even
    // though the overall advance failed -- partial progress the user paid
    // for is never discarded.
    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.some((a) => a.kind === "plan")).toBe(true);
    expect(saved.some((a) => a.kind === "mvp_scope")).toBe(false);

    const stillValidated = await ventures.get(venture.id, { baseDir });
    expect(stillValidated?.stage).toBe("validated");
  });
});

describe("regenerateArtifact", () => {
  it("produces a second plan artifact, retaining the first", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const { regenerateArtifact } = await import("@/server/ventures/regenerateArtifact");

    const venture = await validatedVenture(baseDir);
    await planAndAdvance(venture, { baseDir, provider: stubProvider([planResponse, mvpResponse]) });

    const regenProvider = stubProvider([planResponse]);
    const result = await regenerateArtifact(venture, "plan", "make the wedge sharper", {
      baseDir,
      provider: regenProvider,
    });

    expect(result.ok).toBe(true);

    const plans = (await artifacts.listByVenture(venture.id, { baseDir })).filter((a) => a.kind === "plan");
    expect(plans.length).toBe(2); // both versions retained, none overwritten
  });

  it("passes feedback into the prompt so the model sees the rejection reason", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const { regenerateArtifact } = await import("@/server/ventures/regenerateArtifact");

    const venture = await validatedVenture(baseDir);
    await planAndAdvance(venture, { baseDir, provider: stubProvider([planResponse, mvpResponse]) });

    const regenProvider = stubProvider([planResponse]);
    await regenerateArtifact(venture, "plan", "the ICP is too broad, narrow it", {
      baseDir,
      provider: regenProvider,
    });

    const promptSeen = (regenProvider.complete as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(promptSeen).toContain("the ICP is too broad, narrow it");
  });

  it("marks the previous plan Decision as regenerated with the feedback reason (docs/reviews/2026-07-30-stack-position.md §5.4)", async () => {
    const { planAndAdvance } = await import("@/server/ventures/planAndAdvance");
    const { regenerateArtifact } = await import("@/server/ventures/regenerateArtifact");
    const decisions = await import("@/server/db/repositories/decisions");

    const venture = await validatedVenture(baseDir);
    await planAndAdvance(venture, { baseDir, provider: stubProvider([planResponse, mvpResponse]) });

    const firstPlanArtifact = (await artifacts.listByVenture(venture.id, { baseDir })).find((a) => a.kind === "plan")!;

    await regenerateArtifact(venture, "plan", "the wedge is too vague", {
      baseDir,
      provider: stubProvider([planResponse]),
    });

    const firstDecision = await decisions.findByArtifactId(firstPlanArtifact.id, { baseDir });
    expect(firstDecision?.humanVerdict).toBe("regenerated");
    expect(firstDecision?.humanReason).toBe("the wedge is too vague");
  });

  it("fails readably when regenerating mvp_scope before a plan exists", async () => {
    const { regenerateArtifact } = await import("@/server/ventures/regenerateArtifact");
    const venture = await validatedVenture(baseDir);

    const result = await regenerateArtifact(venture, "mvp_scope", "feedback", {
      baseDir,
      provider: stubProvider([mvpResponse]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
  });
});
