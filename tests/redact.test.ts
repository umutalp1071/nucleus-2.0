import { describe, expect, it } from "vitest";
import { redactKey, redactSecrets } from "@/server/redact";

describe("redactKey", () => {
  it("shows only a short prefix and suffix", () => {
    const redacted = redactKey("sk-or-abcdefghijklmnopqrstuvwxyz1234");
    expect(redacted).toBe("sk-or-...1234");
    expect(redacted).not.toContain("abcdefgh");
  });

  it("fully masks very short strings", () => {
    expect(redactKey("short")).toBe("****");
  });
});

describe("redactSecrets", () => {
  it("strips an OpenRouter-shaped key out of an arbitrary string", () => {
    const message = "call failed with key sk-or-v1-abc123XYZ- attached";
    expect(redactSecrets(message)).toBe("call failed with key [redacted] attached");
  });

  it("leaves strings with no key untouched", () => {
    expect(redactSecrets("nothing secret here")).toBe("nothing secret here");
  });

  it("redacts multiple occurrences", () => {
    const message = "sk-or-aaaa and sk-or-bbbb";
    expect(redactSecrets(message)).toBe("[redacted] and [redacted]");
  });
});
