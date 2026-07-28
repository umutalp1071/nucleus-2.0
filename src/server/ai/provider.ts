import { config } from "../config";
import { FIXTURES } from "./fixtures";
import * as settingsRepo from "../db/repositories/settings";

// The ONLY file in the repo permitted to reference the OpenRouter host —
// enforced by tests/boundaries.test.ts.

export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
}

export interface Provider {
  complete(prompt: string, modelId: string, taskName: string): Promise<CompletionResult>;
}

export function makeOpenRouterProvider(apiKey: string): Provider {
  return {
    async complete(prompt, modelId) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        throw new Error(`provider_error: ${res.status}`);
      }
      const data = await res.json();
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      };
    },
  };
}

// Deterministic and free — this is simultaneously the test infrastructure,
// the zero-setup demo mode, and what lets an agent execute the whole plan
// without an OpenRouter account. Never delete this. See
// docs/plan/00-ANSWER.md §3.5 / ARCHITECTURE.md §Provider abstraction.
export const mock: Provider = {
  async complete(prompt, _modelId, taskName) {
    const fixture = FIXTURES[taskName] ?? {};
    const text = JSON.stringify(fixture);
    return {
      text,
      promptTokens: Math.max(1, Math.ceil(prompt.length / 4)),
      completionTokens: Math.max(1, Math.ceil(text.length / 4)),
    };
  },
};

interface ResolveOpts {
  baseDir?: string;
}

// The stored key in Settings wins over the env var — the UI is the primary
// path, .env is a fallback for local development. Re-read fresh on every
// call, never cached, so adding or removing a key in Settings takes effect
// on the very next request with no restart.
export async function resolveApiKey(opts?: ResolveOpts): Promise<string | null> {
  const stored = await settingsRepo.get<string | null>("openRouterApiKey", null, opts);
  return stored ?? config.OPENROUTER_API_KEY ?? null;
}

export async function hasAiKeyConfigured(opts?: ResolveOpts): Promise<boolean> {
  return (await resolveApiKey(opts)) !== null;
}

export async function resolveProvider(
  opts?: ResolveOpts
): Promise<{ provider: Provider; isMock: boolean }> {
  const apiKey = await resolveApiKey(opts);
  if (!apiKey) return { provider: mock, isMock: true };
  return { provider: makeOpenRouterProvider(apiKey), isMock: false };
}
