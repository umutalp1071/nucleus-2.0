import { config, hasAiKey } from "../config";
import { FIXTURES } from "./fixtures";

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

const openrouter: Provider = {
  async complete(prompt, modelId) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
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

// Deterministic and free — this is simultaneously the test infrastructure,
// the zero-setup demo mode, and what lets an agent execute the whole plan
// without an OpenRouter account. Never delete this. See
// docs/plan/00-ANSWER.md §3.5 / ARCHITECTURE.md §Provider abstraction.
const mock: Provider = {
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

export const provider: Provider = hasAiKey() ? openrouter : mock;
