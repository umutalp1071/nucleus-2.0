import { describe, expect, it } from "vitest";
import type { NucleusEvent, Prediction } from "@/lib/domain";

function event(overrides: Partial<NucleusEvent>): NucleusEvent {
  return {
    id: "e1",
    ventureId: "v1",
    type: "venture.created",
    summary: "s",
    payload: undefined,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function prediction(overrides: Partial<Prediction>): Prediction {
  return {
    id: "p1",
    ventureId: "v1",
    decisionId: "d1",
    claim: "25 WAU by 6 weeks",
    metric: "Weekly active users",
    target: 25,
    resolveBy: "2026-09-01",
    source: "plan.successMetric",
    status: "open",
    resolvedAt: null,
    resolvedBy: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectStory", () => {
  it("returns [] for an empty window", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    expect(selectStory([], [])).toEqual([]);
  });

  it("a killed verdict outranks a routine event like venture.created", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const killed = event({
      id: "e-killed",
      type: "venture.advanced",
      payload: { from: "validated", to: "killed" },
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    const created = event({ id: "e-created", type: "venture.created", createdAt: "2026-08-02T00:00:00.000Z" });

    const result = selectStory([created, killed], []);

    expect(result[0].id).toBe("e-killed");
    expect(result.some((e) => e.id === "e-created")).toBe(false);
  });

  it("routine CRUD (venture.created) scores zero and is excluded", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const created = event({ type: "venture.created" });
    expect(selectStory([created], [])).toEqual([]);
  });

  it("a resolved-missed prediction is included and ranks alongside a killed verdict", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const missed = prediction({ status: "missed", resolvedAt: "2026-08-05T00:00:00.000Z" });
    const stageTransition = event({
      type: "venture.advanced",
      payload: { from: "planned", to: "building" },
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    const result = selectStory([stageTransition], [missed]);

    expect(result.some((e) => e.type === "prediction.missed")).toBe(true);
    // the missed prediction (highest) outranks a plain stage transition (high)
    expect(result[0].type).toBe("prediction.missed");
  });

  it("an open or hit prediction is not treated as a story", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const open = prediction({ status: "open" });
    const hit = prediction({ id: "p2", status: "hit" });
    expect(selectStory([], [open, hit])).toEqual([]);
  });

  it("budget.blocked and venture.deployed both score above zero", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const blocked = event({ type: "budget.blocked" });
    const deployed = event({ type: "venture.deployed" });
    const result = selectStory([blocked, deployed], []);
    expect(result).toHaveLength(2);
  });

  it("respects the limit, keeping the highest scored first", async () => {
    const { selectStory } = await import("@/server/content/selectStory");
    const events = [
      event({ id: "a", type: "budget.blocked", createdAt: "2026-08-01T00:00:00.000Z" }),
      event({ id: "b", type: "venture.deployed", createdAt: "2026-08-02T00:00:00.000Z" }),
      event({
        id: "c",
        type: "venture.advanced",
        payload: { from: "validated", to: "killed" },
        createdAt: "2026-08-03T00:00:00.000Z",
      }),
    ];
    const result = selectStory(events, [], 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c");
  });
});
