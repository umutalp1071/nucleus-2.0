import { describe, expect, it, vi } from "vitest";

describe("recentCommits", () => {
  it("parses oneline output into an array of trimmed, non-empty lines", async () => {
    const { recentCommits } = await import("@/server/content/git");
    const exec = vi.fn(() => "abc123 feat: one\ndef456 fix: two\n");

    const result = recentCommits({ exec: exec as never });

    expect(result).toEqual(["abc123 feat: one", "def456 fix: two"]);
  });

  it("passes -<limit> and --oneline to git log", async () => {
    const { recentCommits } = await import("@/server/content/git");
    const exec = vi.fn(() => "");

    recentCommits({ limit: 5, exec: exec as never });

    expect(exec).toHaveBeenCalledWith("git", ["log", "-5", "--oneline"], expect.objectContaining({ encoding: "utf8" }));
  });

  it("returns [] instead of throwing when git isn't available", async () => {
    const { recentCommits } = await import("@/server/content/git");
    const exec = vi.fn(() => {
      throw new Error("git not found");
    });

    expect(recentCommits({ exec: exec as never })).toEqual([]);
  });
});
