import * as decisionsRepo from "../db/repositories/decisions";
import * as predictionsRepo from "../db/repositories/predictions";
import { extractPredictions } from "../predictions/extractPredictions";
import type { GatewayResult } from "../ai/gateway";
import type { Artifact } from "@/lib/domain";

interface RecordDecisionInput {
  task: string;
  artifact: Artifact;
  inputRefs: string[];
  result: Extract<GatewayResult<unknown>, { ok: true }>;
}

// Provenance for an artifact, plus any falsifiable predictions the artifact's
// content already contains. One call site per `artifacts.create` closes the
// gap in docs/reviews/2026-07-30-stack-position.md §5.1/§5.2: the model,
// tier, and downgraded/cached/demo flags the gateway already computed and
// previously discarded now get a permanent home.
export async function recordDecision(input: RecordDecisionInput, opts?: { baseDir?: string }): Promise<void> {
  const decision = await decisionsRepo.create(
    {
      ventureId: input.artifact.ventureId,
      task: input.task,
      artifactId: input.artifact.id,
      promptVersion: input.result.promptVersion,
      inputRefs: input.inputRefs,
      modelId: input.result.modelId,
      tierRequested: input.result.tierRequested,
      tierUsed: input.result.tierUsed,
      downgraded: input.result.downgraded,
      cached: input.result.cached,
      demo: input.result.demo,
      costUsd: input.result.costUsd,
      humanVerdict: "pending",
      humanReason: null,
    },
    opts
  );

  for (const prediction of extractPredictions(input.artifact)) {
    await predictionsRepo.create(
      {
        ventureId: input.artifact.ventureId,
        decisionId: decision.id,
        status: "open",
        resolvedAt: null,
        resolvedBy: null,
        ...prediction,
      },
      opts
    );
  }
}
