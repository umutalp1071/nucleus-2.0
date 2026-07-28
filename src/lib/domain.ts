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
