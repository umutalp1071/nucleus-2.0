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

export type StageTone = "positive" | "warning" | "neutral" | "danger";

const TONES: Record<Stage, StageTone> = {
  captured: "neutral",
  validated: "positive",
  planned: "positive",
  building: "warning",
  launched: "positive",
  growing: "positive",
  // killed is a win, not a failure -- muted, not red. See docs/plan/PHASE-04-venture-workspace.md.
  killed: "neutral",
  archived: "neutral",
};

export function stageTone(s: Stage): StageTone {
  return TONES[s];
}
