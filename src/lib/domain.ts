import { z } from "zod";

export const StageSchema = z.enum([
  "captured",
  "validated",
  "planned",
  "building",
  "launched",
  "growing",
  "killed",
  "archived",
]);
export type Stage = z.infer<typeof StageSchema>;

export const VentureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  stage: StageSchema,
  verdictScore: z.number().min(0).max(100).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Venture = z.infer<typeof VentureSchema>;

export const ArtifactKindSchema = z.enum([
  "validation",
  "competitors",
  "plan",
  "mvp_scope",
  "landing_page",
  "content_calendar",
  "build_spec",
]);
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;

export const ArtifactSchema = z.object({
  id: z.string(),
  ventureId: z.string(),
  kind: ArtifactKindSchema,
  stage: StageSchema,
  content: z.unknown(),
  model: z.string(),
  costUsd: z.number(),
  createdAt: z.string(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const NucleusEventSchema = z.object({
  id: z.string(),
  ventureId: z.string().nullable(),
  type: z.string(),
  summary: z.string(),
  payload: z.unknown().optional(),
  createdAt: z.string(),
});
export type NucleusEvent = z.infer<typeof NucleusEventSchema>;

export const AiCallSchema = z.object({
  id: z.string(),
  task: z.string(),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  costUsd: z.number(),
  cached: z.boolean(),
  ventureId: z.string().nullable(),
  createdAt: z.string(),
});
export type AiCall = z.infer<typeof AiCallSchema>;

// AI task output shapes. Defined here (client-safe) rather than in
// src/server/ai/tasks/, so the venture-result UI can import the type without
// importing server code -- the tasks themselves import these schemas back.
export const VerdictSchema = z.object({
  score: z.number().min(0).max(100),
  recommendation: z.enum(["build", "refine", "kill"]),
  headline: z.string().max(120),
  marketSize: z.object({
    estimate: z.string(),
    confidence: z.enum(["low", "medium", "high"]),
    reasoning: z.string(),
  }),
  audience: z.object({
    who: z.string(),
    painLevel: z.enum(["nice-to-have", "painful", "urgent"]),
  }),
  risks: z
    .array(z.object({ risk: z.string(), severity: z.enum(["low", "medium", "high"]) }))
    .min(2)
    .max(5),
  moat: z.string(),
  cheapestTest: z.string(),
  // Required, not optional -- an optional field gets omitted by the model.
  // A required one forces it to argue against the idea it just described.
  whyNot: z.string(),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const CompetitorsSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string(),
        whatTheyDo: z.string(),
        weakness: z.string(),
        howYouWin: z.string(),
      })
    )
    .min(3)
    .max(6),
  differentiationVerdict: z.string(),
  crowdedness: z.enum(["low", "medium", "high"]),
});
export type Competitors = z.infer<typeof CompetitorsSchema>;
