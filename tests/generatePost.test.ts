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
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-generate-post-test-"));
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

const postResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["write-post"]),
  promptTokens: 50,
  completionTokens: 50,
};

async function ventureWithCalendar(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  const planned = await ventures.advance(v.id, "planned", { baseDir });
  await artifacts.create(
    { ventureId: v.id, kind: "content_calendar", stage: "planned", content: FIXTURES["write-content-calendar"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  return planned;
}

describe("generatePost", () => {
  it("makes exactly one AI call and saves a content_post artifact for that day", async () => {
    const { generatePost } = await import("@/server/ventures/generatePost");
    const venture = await ventureWithCalendar(baseDir);
    const provider = stubProvider([postResponse]);

    const result = await generatePost(venture, 1, { baseDir, provider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.artifact.content as { day: number; draft: string };
      expect(content.day).toBe(1);
      expect(content.draft.length).toBeGreaterThan(0);
    }
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "content_post")).toHaveLength(1);
  });

  it("fails readably when there is no calendar yet", async () => {
    const { generatePost } = await import("@/server/ventures/generatePost");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });

    const result = await generatePost(v, 1, { baseDir, provider: stubProvider([postResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
  });

  it("fails with not_found for a day that isn't in the calendar", async () => {
    const { generatePost } = await import("@/server/ventures/generatePost");
    const venture = await ventureWithCalendar(baseDir);

    const result = await generatePost(venture, 2, { baseDir, provider: stubProvider([postResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });
});
