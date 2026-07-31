import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import { FIXTURES } from "@/server/ai/fixtures";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-weekly-review-test-"));
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

const reviewResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["weekly-review"]),
  promptTokens: 50,
  completionTokens: 50,
};

describe("runWeeklyReview", () => {
  it("saves a weekly_review artifact summarizing recent data", async () => {
    const { runWeeklyReview } = await import("@/server/ventures/runWeeklyReview");
    const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
    await artifacts.create(
      { ventureId: v.id, kind: "plan", stage: "captured", content: FIXTURES["plan-venture"], model: "mock", costUsd: 0, demo: false },
      { baseDir }
    );

    const result = await runWeeklyReview(v, { baseDir, provider: stubProvider([reviewResponse]) });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artifact.kind).toBe("weekly_review");
      const content = result.artifact.content as { killCriteriaCheck: string };
      expect(content.killCriteriaCheck.length).toBeGreaterThan(0);
    }
  });

  it("runs even with no plan on file yet", async () => {
    const { runWeeklyReview } = await import("@/server/ventures/runWeeklyReview");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });

    const result = await runWeeklyReview(v, { baseDir, provider: stubProvider([reviewResponse]) });

    expect(result.ok).toBe(true);
  });
});
