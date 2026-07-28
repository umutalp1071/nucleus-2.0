import { describe, expect, it } from "vitest";
import { z } from "zod";

// Mirrors src/server/config.ts's schema directly rather than importing the
// module-level `config` singleton, so each case can parse a different env
// without process.env mutation leaking between tests.
const schema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  NUCLEUS_DATA_DIR: z.string().default(".nucleus"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

describe("config schema", () => {
  it("parses an empty environment with safe defaults", () => {
    const parsed = schema.parse({});
    expect(parsed.NUCLEUS_DATA_DIR).toBe(".nucleus");
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.OPENROUTER_API_KEY).toBeUndefined();
    expect(parsed.VERCEL_TOKEN).toBeUndefined();
  });

  it("accepts a populated environment", () => {
    const parsed = schema.parse({
      OPENROUTER_API_KEY: "sk-or-test",
      NODE_ENV: "test",
    });
    expect(parsed.OPENROUTER_API_KEY).toBe("sk-or-test");
    expect(parsed.NODE_ENV).toBe("test");
  });

  it("rejects an invalid NODE_ENV", () => {
    expect(() => schema.parse({ NODE_ENV: "staging" })).toThrow();
  });

  it("the real config module loads without throwing", async () => {
    const { config, hasAiKey } = await import("@/server/config");
    expect(config.NUCLEUS_DATA_DIR).toBeTruthy();
    expect(typeof hasAiKey()).toBe("boolean");
  });
});
