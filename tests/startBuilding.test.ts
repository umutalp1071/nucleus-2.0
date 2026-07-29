import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifacts from "@/server/db/repositories/artifacts";
import * as buildTasks from "@/server/db/repositories/buildTasks";
import { FIXTURES } from "@/server/ai/fixtures";
import type { MvpScope } from "@/lib/domain";

// Expanding milestones into tasks must never touch the gateway -- the plan
// already contains the content, so a model call here would be paying to
// reformat data already on disk. Mocking runTask turns "zero AI calls" into
// a real regression guard instead of an assertion nobody could break.
const { runTaskSpy } = vi.hoisted(() => ({ runTaskSpy: vi.fn() }));
vi.mock("@/server/ai/gateway", () => ({ runTask: runTaskSpy }));

let tmpDir: string;
let baseDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-start-building-test-"));
  baseDir = tmpDir;
  runTaskSpy.mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function plannedVenture(baseDir: string) {
  const v = await ventures.create({ title: "Idea", description: "an idea worth building" }, { baseDir });
  await ventures.advance(v.id, "validated", { baseDir });
  return ventures.advance(v.id, "planned", { baseDir });
}

describe("startBuilding", () => {
  it("expands each milestone into a task with zero AI calls, and advances to building", async () => {
    const { startBuilding } = await import("@/server/ventures/startBuilding");
    const venture = await plannedVenture(baseDir);
    const mvpScope = FIXTURES["scope-mvp"] as MvpScope;
    await artifacts.create(
      { ventureId: venture.id, kind: "mvp_scope", stage: "planned", content: mvpScope, model: "mock", costUsd: 0, demo: false },
      { baseDir }
    );

    const result = await startBuilding(venture, { baseDir });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.venture.stage).toBe("building");
      expect(result.tasks).toHaveLength(mvpScope.milestones.length);
      expect(result.tasks.every((t) => t.done === false)).toBe(true);
      expect(result.tasks.map((t) => t.milestone)).toEqual(mvpScope.milestones.map((m) => m.name));
    }
    expect(runTaskSpy).not.toHaveBeenCalled();

    const saved = await buildTasks.listByVenture(venture.id, { baseDir });
    expect(saved).toHaveLength(mvpScope.milestones.length);
  });

  it("fails readably when starting building before an MVP scope exists", async () => {
    const { startBuilding } = await import("@/server/ventures/startBuilding");
    const venture = await plannedVenture(baseDir);

    const result = await startBuilding(venture, { baseDir });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_prerequisite");
      expect(result.message).not.toMatch(/model|token|claude|llama|http/i);
    }
    expect(runTaskSpy).not.toHaveBeenCalled();
  });
});
