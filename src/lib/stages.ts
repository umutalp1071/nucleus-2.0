import type { Stage } from "./domain";

export const STAGE_ORDER: Stage[] = [
  "captured",
  "validated",
  "planned",
  "building",
  "launched",
  "growing",
];

const TRANSITIONS: Record<Stage, Stage[]> = {
  captured: ["validated", "killed", "archived"],
  validated: ["planned", "killed", "archived"],
  planned: ["building", "archived"],
  building: ["launched", "archived"],
  launched: ["growing", "archived"],
  growing: ["archived"],
  killed: ["archived"],
  archived: [],
};

export function canTransition(from: Stage, to: Stage): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: Stage, to: Stage): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal stage transition: ${from} -> ${to}`);
  }
}

export function nextStage(from: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(from);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

const LABELS: Record<Stage, string> = {
  captured: "Captured",
  validated: "Validated",
  planned: "Planned",
  building: "Building",
  launched: "Launched",
  growing: "Growing",
  killed: "Killed",
  archived: "Archived",
};

export function stageLabel(s: Stage): string {
  return LABELS[s];
}
