import { describe, expect, it } from "vitest";
import { buildSpecToMarkdown, buildSpecToAgentBrief, buildSpecToPrompt } from "@/lib/build-spec-export";
import { BuildSpecSchema, type BuildSpec } from "@/lib/domain";
import { FIXTURES } from "@/server/ai/fixtures";

const spec = FIXTURES["generate-build-spec"] as BuildSpec;
const ctx = { ventureTitle: "Test Venture", stack: { recommendation: "Next.js + Postgres", reasoning: "fast to ship" } };

describe("generate-build-spec: fixture", () => {
  it("satisfies BuildSpecSchema", () => {
    expect(BuildSpecSchema.safeParse(spec).success).toBe(true);
  });
});

describe("build-spec-export", () => {
  it("markdown includes the venture title, first commit, and every out-of-scope cut", () => {
    const md = buildSpecToMarkdown(spec, ctx);
    expect(md).toContain("Test Venture");
    expect(md).toContain(spec.firstCommit);
    for (const cut of spec.outOfScope) expect(md).toContain(cut);
  });

  it("agent brief includes the stack recommendation and an explicit out-of-scope instruction", () => {
    const brief = buildSpecToAgentBrief(spec, ctx);
    expect(brief).toContain(ctx.stack!.recommendation);
    expect(brief.toLowerCase()).toContain("out of scope");
    expect(brief).toContain(spec.firstCommit);
  });

  it("prompt is a single block containing the summary and first commit", () => {
    const prompt = buildSpecToPrompt(spec, ctx);
    expect(prompt.split("\n")).toHaveLength(1);
    expect(prompt).toContain(spec.summary);
    expect(prompt).toContain(spec.firstCommit);
  });

  it("omits the stack section entirely when no stack is given", () => {
    const md = buildSpecToMarkdown(spec, { ventureTitle: "No Stack" });
    expect(md).not.toContain("## Stack");
  });
});
