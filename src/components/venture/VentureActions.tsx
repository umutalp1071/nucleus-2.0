"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Stage } from "@/lib/domain";

export function VentureActions({ ventureId, stage }: { ventureId: string; stage: Stage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advanceTo(to: Stage) {
    setBusy(true);
    setError(null);
    await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setBusy(false);
    router.refresh();
  }

  // No `to` in the body -- the route runs whatever step is appropriate to
  // the venture's current stage (plan-venture + scope-mvp for a validated
  // one, milestone expansion with zero AI calls for a planned one) and only
  // then advances. A plain {to:"planned"} would skip generating the plan
  // entirely.
  async function runNextStep() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't complete that step. Try again.");
      return;
    }
    router.refresh();
  }

  const nextStep =
    stage === "validated"
      ? { label: "Advance to Planning", busyLabel: "Planning..." }
      : stage === "planned"
      ? { label: "Start Building", busyLabel: "Starting..." }
      : null;
  const canKill = stage === "captured" || stage === "validated";
  const canArchive = stage !== "archived";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {nextStep && (
          <button
            onClick={runNextStep}
            disabled={busy}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? nextStep.busyLabel : nextStep.label}
          </button>
        )}
        {canKill && (
          <button
            onClick={() => advanceTo("killed")}
            disabled={busy}
            className="rounded-md border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Kill
          </button>
        )}
        {canArchive && (
          <button
            onClick={() => advanceTo("archived")}
            disabled={busy}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            Archive
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
