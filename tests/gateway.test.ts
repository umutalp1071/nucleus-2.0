import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import { MODELS } from "@/server/ai/models";
import { TASKS } from "@/server/ai/tasks";
import { FIXTURES } from "@/server/ai/fixtures";

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-gateway-test-"));
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

const GENEROUS_CAPS = { daily: 10, weekly: 30, monthly: 50 };

describe("gateway: happy path", () => {
  it("returns typed data and records exactly one ai call", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([{ text: '{"echo":"hi"}', promptTokens: 10, completionTokens: 5 }]);

    const result = await runTask<{ echo: string }>(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: GENEROUS_CAPS }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ echo: "hi" });
      expect(result.cached).toBe(false);
      expect(result.costUsd).toBeGreaterThan(0);
    }
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);

    const { sumSince } = await import("@/server/db/repositories/aiCalls");
    const total = await sumSince(new Date(0), { baseDir });
    expect(total).toBeGreaterThan(0);
  });
});

describe("gateway: schema repair retry", () => {
  it("retries once on malformed output, succeeds, and records two ai calls", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([
      { text: "not json at all", promptTokens: 10, completionTokens: 5 },
      { text: '{"echo":"fixed"}', promptTokens: 15, completionTokens: 5 },
    ]);

    const result = await runTask<{ echo: string }>(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: GENEROUS_CAPS }
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ echo: "fixed" });
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);

    // aiCalls repository has no `list`; count rows via the store directly.
    const { readCollection } = await import("@/server/db/store");
    const rows = await readCollection("ai-calls", { baseDir });
    expect(rows.length).toBe(2);
  });

  it("fails with invalid_output after two malformed attempts, still records two ai calls", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([
      { text: "not json", promptTokens: 10, completionTokens: 5 },
      { text: "still not json", promptTokens: 10, completionTokens: 5 },
    ]);

    const result = await runTask(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: GENEROUS_CAPS }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_output");
      expect(result.message).not.toMatch(/model|token|claude|llama|http/i);
    }
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);

    const { readCollection } = await import("@/server/db/store");
    const rows = await readCollection("ai-calls", { baseDir });
    expect(rows.length).toBe(2);
  });
});

describe("gateway: budget enforcement", () => {
  it("blocks the call and never reaches the provider", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([{ text: '{"echo":"hi"}', promptTokens: 10, completionTokens: 5 }]);
    const zeroCaps = { daily: 0, weekly: 0, monthly: 0 };

    const result = await runTask(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: zeroCaps }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("budget_exceeded");
      expect(result.message).not.toMatch(/model|token|claude|llama|http|\$0/i);
    }
    // The single most important assertion in this file: a blocked call must
    // never reach the provider.
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it("downgrades to a cheaper tier instead of blocking when some headroom remains", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([{ text: '{"echo":"hi"}', promptTokens: 10, completionTokens: 5 }]);

    // echo-check is tier "mid" ($1.00/M in, $5.00/M out), estimate ~$0.000119
    // for this prompt. A cap between the cheap-tier estimate (~$0.00000098)
    // and the mid-tier estimate forces exactly one downgrade step.
    const tightCaps = { daily: 0.00005, weekly: 30, monthly: 50 };

    const result = await runTask(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: tightCaps }
    );

    expect(result.ok).toBe(true);
    const calls = (provider.complete as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(1);
    const modelIdUsed = calls[0][1];
    expect(modelIdUsed).toBe(MODELS.cheap.id);
    expect(modelIdUsed).not.toBe(MODELS.mid.id);
  });

  it("never downgrades below the task's minTier", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([{ text: '{"echo":"hi"}', promptTokens: 10, completionTokens: 5 }]);
    // A cap so tight even the cheap tier's estimate (~$0.00000098) doesn't
    // fit, and echo-check's minTier is "cheap" -- there's nowhere lower to
    // go, so this must block rather than silently using an unsanctioned tier.
    const impossibleCaps = { daily: 0.0000005, weekly: 30, monthly: 50 };

    const result = await runTask(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: impossibleCaps }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("budget_exceeded");
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });
});

describe("gateway: cache", () => {
  it("a cache hit never calls the provider and costs nothing", async () => {
    const { runTask } = await import("@/server/ai/gateway");
    const provider = stubProvider([{ text: '{"echo":"first"}', promptTokens: 10, completionTokens: 5 }]);

    const first = await runTask<{ echo: string }>(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: GENEROUS_CAPS }
    );
    expect(first.ok).toBe(true);

    const second = await runTask<{ echo: string }>(
      "echo-check",
      { message: "hi" },
      { baseDir, provider, caps: GENEROUS_CAPS }
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.cached).toBe(true);
      expect(second.costUsd).toBe(0);
      expect(second.data).toEqual({ echo: "first" });
    }
    // Only the first call should have reached the provider.
    expect((provider.complete as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});

describe("gateway: fixtures satisfy their schemas", () => {
  it("every registered fixture validates against its task's zod schema", () => {
    for (const [name, task] of Object.entries(TASKS)) {
      const fixture = FIXTURES[name];
      expect(fixture, `missing fixture for task "${name}"`).toBeDefined();
      const parsed = task.schema.safeParse(fixture);
      expect(parsed.success, `fixture for "${name}" failed schema validation`).toBe(true);
    }
  });
});
