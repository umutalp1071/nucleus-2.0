import { z } from "zod";
import type { Tier } from "../models";
import { validateIdea } from "./validate-idea";
import { analyzeCompetitors } from "./analyze-competitors";
import { planVenture } from "./plan-venture";
import { scopeMvp } from "./scope-mvp";
import { generateBuildSpec } from "./generate-build-spec";

export interface TaskDef<I = unknown, O = unknown> {
  name: string;
  tier: Tier;
  minTier: Tier;
  expectedOutTokens: number;
  schema: z.ZodType<O>;
  // Method shorthand (not a `prompt: (input: I) => string` property) so
  // TypeScript checks this bivariantly — a heterogeneous TASKS registry can
  // hold TaskDef<SpecificInput, SpecificOutput> entries under the shared
  // TaskDef type without a variance error.
  prompt(input: I): string;
}

const echoCheckSchema = z.object({ echo: z.string() });

// Used only by tests in this phase — proves the gateway plumbing end to end
// without committing to a real prompt/schema yet. Phase 03 adds validate-idea.
export const echoCheck: TaskDef<{ message: string }, z.infer<typeof echoCheckSchema>> = {
  name: "echo-check",
  tier: "mid", // leaves one downgrade step (mid -> cheap) for the gateway to exercise in tests
  minTier: "cheap",
  expectedOutTokens: 20,
  schema: echoCheckSchema,
  prompt: (input) => `Respond with JSON matching {"echo": string} where echo equals exactly: ${input.message}`,
};

export const TASKS = {
  "echo-check": echoCheck,
  "validate-idea": validateIdea,
  "analyze-competitors": analyzeCompetitors,
  "plan-venture": planVenture,
  "scope-mvp": scopeMvp,
  "generate-build-spec": generateBuildSpec,
} as const satisfies Record<string, TaskDef>;

export type TaskName = keyof typeof TASKS;
