import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate config for the calibration harness. It is deliberately NOT in
// vitest.config.ts's include glob: `npm run verify` must stay free, offline
// and deterministic, and this run costs real money and hits a real provider.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/eval/run.eval.ts"],
    // One idea at a time. Parallel runs would race the budget ledger's
    // read-modify-write and understate spend.
    fileParallelism: false,
    testTimeout: 30 * 60 * 1000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
