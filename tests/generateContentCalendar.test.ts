import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import { FIXTURES } from "@/server/ai/fixtures";
import { CalendarSchema } from "@/lib/domain";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-content-calendar-test-"));
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

const calendarResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["write-content-calendar"]),
  promptTokens: 100,
  completionTokens: 100,
};

async function plannedVentureWithPlan(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  const planned = await ventures.advance(v.id, "planned", { baseDir });
  await artifacts.create(
    { ventureId: v.id, kind: "plan", stage: "planned", content: FIXTURES["plan-venture"], model: "mock", costUsd: 0, demo: false },
    { baseDir }
  );
  return planned;
}

describe("CalendarSchema", () => {
  it("rejects 11 or 13 posts", () => {
    const base = FIXTURES["write-content-calendar"] as { posts: unknown[] };
    expect(CalendarSchema.safeParse({ ...base, posts: base.posts.slice(0, 11) }).success).toBe(false);
    expect(CalendarSchema.safeParse({ ...base, posts: [...base.posts, base.posts[0]] }).success).toBe(false);
    expect(CalendarSchema.safeParse(base).success).toBe(true);
  });
});

describe("generateContentCalendar", () => {
  it("saves a content_calendar artifact generated from the plan", async () => {
    const { generateContentCalendar } = await import("@/server/ventures/generateContentCalendar");
    const venture = await plannedVentureWithPlan(baseDir);

    const result = await generateContentCalendar(venture, { baseDir, provider: stubProvider([calendarResponse]) });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const content = result.artifact.content as { posts: unknown[] };
      expect(content.posts).toHaveLength(12);
    }

    const saved = await artifacts.listByVenture(venture.id, { baseDir });
    expect(saved.filter((a) => a.kind === "content_calendar")).toHaveLength(1);
  });

  it("fails readably when there is no plan yet", async () => {
    const { generateContentCalendar } = await import("@/server/ventures/generateContentCalendar");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    const validated = await ventures.advance(v.id, "validated", { baseDir });

    const result = await generateContentCalendar(validated, { baseDir, provider: stubProvider([calendarResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_prerequisite");
  });

  it("rejects a calendar whose channels aren't drawn from the plan's ICP where list", async () => {
    const { generateContentCalendar } = await import("@/server/ventures/generateContentCalendar");
    const venture = await plannedVentureWithPlan(baseDir);
    const divergent = { ...FIXTURES["write-content-calendar"] as object, channels: [{ channel: "TikTok", why: "x", cadence: "1x/week" }, { channel: "Instagram", why: "x", cadence: "1x/week" }] };
    const divergentResponse: CompletionResult = { text: JSON.stringify(divergent), promptTokens: 100, completionTokens: 100 };

    const result = await generateContentCalendar(venture, { baseDir, provider: stubProvider([divergentResponse]) });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_output");
  });
});
