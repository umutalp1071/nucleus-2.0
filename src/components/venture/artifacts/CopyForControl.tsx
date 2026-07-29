"use client";

import { useState } from "react";
import {
  buildSpecToMarkdown,
  buildSpecToAgentBrief,
  buildSpecToPrompt,
  type BuildSpecContext,
} from "@/lib/build-spec-export";
import type { BuildSpec } from "@/lib/domain";

type Format = "markdown" | "agent-brief" | "prompt";

const FORMATS: Array<{ id: Format; label: string; filename: string }> = [
  { id: "markdown", label: "Markdown", filename: "build-spec.md" },
  { id: "agent-brief", label: "Agent brief", filename: "CLAUDE.md" },
  { id: "prompt", label: "Prompt (Lovable/v0/Bolt)", filename: "build-prompt.txt" },
];

function render(format: Format, spec: BuildSpec, ctx: BuildSpecContext): string {
  if (format === "markdown") return buildSpecToMarkdown(spec, ctx);
  if (format === "agent-brief") return buildSpecToAgentBrief(spec, ctx);
  return buildSpecToPrompt(spec, ctx);
}

// One artifact, three destinations -- copy to clipboard and download both,
// so the spec can leave Nucleus however the next tool expects it. See
// docs/plan/PHASE-07-build-stage.md.
export function CopyForControl({ spec, ctx }: { spec: BuildSpec; ctx: BuildSpecContext }) {
  const [copied, setCopied] = useState<Format | null>(null);

  async function copy(format: Format) {
    await navigator.clipboard.writeText(render(format, spec, ctx));
    setCopied(format);
    setTimeout(() => setCopied((c) => (c === format ? null : c)), 2000);
  }

  function download(format: Format, filename: string) {
    const blob = new Blob([render(format, spec, ctx)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2">
      <p className="text-xs text-muted-foreground">Copy for...</p>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <div key={f.id} className="flex items-center gap-1 rounded-md border border-border">
            <button
              onClick={() => copy(f.id)}
              className="px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              {copied === f.id ? "Copied!" : f.label}
            </button>
            <button
              onClick={() => download(f.id, f.filename)}
              title={`Download ${f.filename}`}
              aria-label={`Download ${f.filename}`}
              className="border-l border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              &darr;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
