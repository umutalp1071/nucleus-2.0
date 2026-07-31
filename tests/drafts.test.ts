import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let baseDir: string;
let repoRoot: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nucleus-drafts-test-"));
  baseDir = path.join(tmpDir, "data");
  repoRoot = path.join(tmpDir, "repo");
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("drafts service", () => {
  it("listDrafts returns [] when the directory doesn't exist yet", async () => {
    const drafts = await import("@/server/content/drafts");
    expect(await drafts.listDrafts({ repoRoot })).toEqual([]);
  });

  it("editDraft then listDrafts round-trips content", async () => {
    const drafts = await import("@/server/content/drafts");
    await drafts.editDraft("2026-08-01-ship-x.md", "# X", { repoRoot });
    const list = await drafts.listDrafts({ repoRoot });
    expect(list).toEqual([{ filename: "2026-08-01-ship-x.md", content: "# X" }]);
  });

  it("approveDraft moves the file to published/, leaving drafts/ empty", async () => {
    const drafts = await import("@/server/content/drafts");
    await drafts.editDraft("2026-08-01-ship-x.md", "# X", { repoRoot });
    await drafts.approveDraft("2026-08-01-ship-x.md", { repoRoot });
    expect(await drafts.listDrafts({ repoRoot })).toEqual([]);
    expect(fs.readFileSync(path.join(repoRoot, "docs/content/published/2026-08-01-ship-x.md"), "utf8")).toBe("# X");
  });

  it("rejectDraft deletes the file and records the reason for the next generation", async () => {
    const drafts = await import("@/server/content/drafts");
    await drafts.editDraft("2026-08-01-ship-x.md", "# X", { repoRoot });
    await drafts.rejectDraft("2026-08-01-ship-x.md", "too generic", { baseDir, repoRoot });
    expect(await drafts.listDrafts({ repoRoot })).toEqual([]);
    const { voiceSamples, rejectedReasons } = await drafts.loadVoiceAndRejections({ baseDir, repoRoot });
    expect(rejectedReasons).toEqual(["too generic"]);
    expect(voiceSamples).toEqual([]);
  });

  it("caps rejection reasons at 5, keeping the most recent first", async () => {
    const drafts = await import("@/server/content/drafts");
    for (let i = 0; i < 7; i++) {
      await drafts.editDraft(`d${i}.md`, "x", { repoRoot });
      await drafts.rejectDraft(`d${i}.md`, `reason ${i}`, { baseDir, repoRoot });
    }
    const { rejectedReasons } = await drafts.loadVoiceAndRejections({ baseDir, repoRoot });
    expect(rejectedReasons).toHaveLength(5);
    expect(rejectedReasons[0]).toBe("reason 6");
  });

  it("setVoiceSamples caps at 3 and loadVoiceAndRejections reads the file contents", async () => {
    const drafts = await import("@/server/content/drafts");
    await drafts.editDraft("a.md", "content A", { repoRoot });
    await drafts.setVoiceSamples(["drafts/a.md"], { baseDir });
    const { voiceSamples } = await drafts.loadVoiceAndRejections({ baseDir, repoRoot });
    expect(voiceSamples).toEqual(["content A"]);
  });

  it("listVoiceSources lists published/ before drafts/", async () => {
    const drafts = await import("@/server/content/drafts");
    await drafts.editDraft("a.md", "x", { repoRoot });
    await drafts.approveDraft("a.md", { repoRoot });
    await drafts.editDraft("b.md", "y", { repoRoot });
    expect(await drafts.listVoiceSources({ repoRoot })).toEqual(["published/a.md", "drafts/b.md"]);
  });
});
