import { describe, expect, it } from "vitest";

// Proves the test harness itself runs. Delete once real tests exist
// elsewhere (they do, as of this same phase — kept one more phase for
// visibility in CI output).
describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
