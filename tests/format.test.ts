import { describe, expect, it } from "vitest";
import { relativeTime, formatUsd } from "@/lib/format";

describe("relativeTime", () => {
  it("returns 'just now' for under a minute", () => {
    expect(relativeTime(new Date(Date.now() - 5000).toISOString())).toBe("just now");
  });

  it("returns minutes for under an hour", () => {
    expect(relativeTime(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5m ago");
  });

  it("returns hours for under a day", () => {
    expect(relativeTime(new Date(Date.now() - 3 * 3600_000).toISOString())).toBe("3h ago");
  });

  it("returns days for under a week", () => {
    expect(relativeTime(new Date(Date.now() - 2 * 86400_000).toISOString())).toBe("2d ago");
  });

  it("falls back to a date string beyond a week", () => {
    const iso = new Date(Date.now() - 30 * 86400_000).toISOString();
    expect(relativeTime(iso)).toBe(new Date(iso).toLocaleDateString());
  });
});

describe("formatUsd", () => {
  it("formats zero plainly", () => {
    expect(formatUsd(0)).toBe("$0");
  });

  it("formats sub-cent amounts with more precision", () => {
    expect(formatUsd(0.0042)).toBe("$0.0042");
  });

  it("formats normal amounts to two decimals", () => {
    expect(formatUsd(12.5)).toBe("$12.50");
  });
});
