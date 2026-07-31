import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { Provider, CompletionResult } from "@/server/ai/provider";
import * as ventures from "@/server/db/repositories/ventures";
import { recordEvent } from "@/server/events";
import { FIXTURES } from "@/server/ai/fixtures";

let tmpDir: string;
let baseDir: string;
let repoRoot: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-bip-test-"));
  baseDir = path.join(tmpDir, "data");
  repoRoot = path.join(tmpDir, "repo");
  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(repoRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function stubProvider(responses: Array<CompletionResult | Error>): Provider {
  let call = 0;
  const complete = vi.fn(async (): Promise<CompletionResult> => {
    const next = responses[Math.min(call, responses.length - 1)];
    call++;
    if (next instanceof Error) throw next;
    return next;
  });
  return { complete };
}

const bipResponse: CompletionResult = {
  text: JSON.stringify(FIXTURES["write-buildinpublic"]),
  promptTokens: 100,
  completionTokens: 100,
};

describe("generateBuildInPublicPost: venture mode", () => {
  it("returns no_story when nothing storyworthy happened", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });

    const result = await generateBuildInPublicPost(
      { mode: "venture", ventureId: v.id },
      { baseDir, repoRoot, provider: stubProvider([bipResponse]) }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_story");
  });

  it("not_found for a missing venture", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    const result = await generateBuildInPublicPost(
      { mode: "venture", ventureId: "missing" },
      { baseDir, repoRoot, provider: stubProvider([bipResponse]) }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_found");
  });

  it("writes a draft file when a killed verdict is in the event log", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    await ventures.advance(v.id, "killed", { baseDir });

    const result = await generateBuildInPublicPost(
      { mode: "venture", ventureId: v.id },
      { baseDir, repoRoot, provider: stubProvider([bipResponse]) }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.post.title.length).toBeGreaterThan(0);
      const file = fs.readFileSync(path.join(repoRoot, "docs/content/drafts", result.filename), "utf8");
      expect(file).toContain(result.post.title);
      expect(file).toContain("## Visual");
      expect(file).toContain("#buildinpublic #nucleus2");
    }
  });
});

describe("generateBuildInPublicPost: self mode", () => {
  it("returns no_story when there's nothing to read from the repo", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    const exec = vi.fn(() => {
      throw new Error("no git");
    });
    const result = await generateBuildInPublicPost(
      { mode: "self" },
      { baseDir, repoRoot, provider: stubProvider([bipResponse]) }
    );
    void exec;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_story");
  });

  it("builds a narrative from PROGRESS.md and learning.md and writes a draft", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    fs.mkdirSync(path.join(repoRoot, "docs/plan"), { recursive: true });
    fs.mkdirSync(path.join(repoRoot, "docs/workflow"), { recursive: true });
    fs.writeFileSync(
      path.join(repoRoot, "docs/plan/PROGRESS.md"),
      "| 09 | Growth Stage | ✅ done | `abc123` | ship |\n"
    );
    fs.writeFileSync(
      path.join(repoRoot, "docs/workflow/learning.md"),
      "# Session Learning Log\n\n## 2026-07-31 — Phase 09\n\nSome notes.\n\n## 2026-07-30 — Phase 08.5\n\nOlder notes.\n"
    );

    const result = await generateBuildInPublicPost(
      { mode: "self" },
      { baseDir, repoRoot, provider: stubProvider([bipResponse]) }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      const file = fs.readFileSync(path.join(repoRoot, "docs/content/drafts", result.filename), "utf8");
      expect(file).toContain(result.post.title);
    }
  });
});

describe("generateBuildInPublicPost: voice samples and rejection reasons", () => {
  it("embeds stored voice samples and rejection reasons into the rendered prompt", async () => {
    const { generateBuildInPublicPost } = await import("@/server/content/generateBuildInPublicPost");
    const settings = await import("@/server/db/repositories/settings");
    const v = await ventures.create({ title: "Idea", description: "x" }, { baseDir });
    await ventures.advance(v.id, "killed", { baseDir });

    fs.mkdirSync(path.join(repoRoot, "docs/content/drafts"), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, "docs/content/drafts/sample.md"), "# A real published post\n\nBody text here.");
    await settings.set("buildInPublicVoiceSamples", ["drafts/sample.md"], { baseDir });
    await settings.set("buildInPublicRejections", ["too much jargon"], { baseDir });

    let capturedPrompt = "";
    const provider: Provider = {
      complete: vi.fn(async (prompt: string) => {
        capturedPrompt = prompt;
        return bipResponse;
      }),
    };

    const result = await generateBuildInPublicPost(
      { mode: "venture", ventureId: v.id },
      { baseDir, repoRoot, provider }
    );

    expect(result.ok).toBe(true);
    expect(capturedPrompt).toContain("A real published post");
    expect(capturedPrompt).toContain("too much jargon");
  });
});
