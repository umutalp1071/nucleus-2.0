import { describe, expect, it } from "vitest";
import { STAGE_ORDER, canTransition, assertTransition, nextStage, stageLabel } from "@/lib/stages";
import { StageSchema, type Stage } from "@/lib/domain";

const ALL_STAGES = StageSchema.options;

describe("stage machine", () => {
  it("allows the documented forward path", () => {
    expect(canTransition("captured", "validated")).toBe(true);
    expect(canTransition("validated", "planned")).toBe(true);
    expect(canTransition("planned", "building")).toBe(true);
    expect(canTransition("building", "launched")).toBe(true);
    expect(canTransition("launched", "growing")).toBe(true);
  });

  it("rejects skipping a stage", () => {
    expect(canTransition("captured", "planned")).toBe(false);
    expect(canTransition("captured", "building")).toBe(false);
    expect(canTransition("validated", "launched")).toBe(false);
  });

  it("rejects moving backward", () => {
    expect(canTransition("planned", "captured")).toBe(false);
    expect(canTransition("growing", "launched")).toBe(false);
  });

  it("killed is reachable only from captured or validated", () => {
    expect(canTransition("captured", "killed")).toBe(true);
    expect(canTransition("validated", "killed")).toBe(true);
    expect(canTransition("planned", "killed")).toBe(false);
    expect(canTransition("building", "killed")).toBe(false);
    expect(canTransition("launched", "killed")).toBe(false);
    expect(canTransition("growing", "killed")).toBe(false);
  });

  it("archived is a terminal stage with no outgoing transitions", () => {
    for (const stage of ALL_STAGES) {
      expect(canTransition("archived", stage)).toBe(false);
    }
  });

  it("every stage can reach archived except archived itself", () => {
    for (const stage of ALL_STAGES) {
      if (stage === "archived") continue;
      expect(canTransition(stage, "archived")).toBe(true);
    }
  });

  it("assertTransition throws on an illegal move and is silent on a legal one", () => {
    expect(() => assertTransition("captured", "launched")).toThrow();
    expect(() => assertTransition("captured", "validated")).not.toThrow();
  });

  it("nextStage walks STAGE_ORDER and stops at the end", () => {
    expect(nextStage("captured")).toBe("validated");
    expect(nextStage("launched")).toBe("growing");
    expect(nextStage("growing")).toBeNull();
    expect(nextStage("killed")).toBeNull();
    expect(nextStage("archived")).toBeNull();
  });

  it("every stage in the domain schema has a transition table entry", () => {
    // This is the assertion that saves a future session: it fails the moment
    // someone adds a stage to StageSchema and forgets the transition table.
    for (const stage of ALL_STAGES) {
      expect(() => canTransition(stage, stage)).not.toThrow();
    }
  });

  it("STAGE_ORDER only contains the non-terminal happy-path stages", () => {
    const order = new Set(STAGE_ORDER);
    expect(order.has("killed" as Stage)).toBe(false);
    expect(order.has("archived" as Stage)).toBe(false);
    expect(STAGE_ORDER.length).toBe(ALL_STAGES.length - 2);
  });

  it("stageLabel returns a readable label for every stage", () => {
    for (const stage of ALL_STAGES) {
      expect(stageLabel(stage).length).toBeGreaterThan(0);
    }
  });
});
