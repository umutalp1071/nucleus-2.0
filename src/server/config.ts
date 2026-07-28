import { z } from "zod";

const schema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  NUCLEUS_DATA_DIR: z.string().default(".nucleus"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const config = schema.parse(process.env);
export const hasAiKey = () => Boolean(config.OPENROUTER_API_KEY);
