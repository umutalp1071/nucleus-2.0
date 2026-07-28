// Mock-provider fixtures, keyed by task name. Every entry must satisfy its
// task's zod schema — tests/gateway.test.ts iterates the registry and
// asserts exactly that, so a drifted fixture fails loudly instead of
// silently passing a broken demo mode.
export const FIXTURES: Record<string, unknown> = {
  "echo-check": { echo: "mock-echo" },
};
