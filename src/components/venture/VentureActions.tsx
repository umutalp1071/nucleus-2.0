"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Stage } from "@/lib/domain";

export function VentureActions({ ventureId, stage }: { ventureId: string; stage: Stage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function advanceTo(to: Stage) {
    setBusy(true);
    await fetch(`/api/ventures/${ventureId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setBusy(false);
    router.refresh();
  }

  const canKill = stage === "captured" || stage === "validated";
  const canArchive = stage !== "archived";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled
        title="Coming in Phase 06 -- Planning"
        className="cursor-not-allowed rounded-md border border-border px-3 py-2 text-sm font-semibold opacity-50"
      >
        Advance to Planning
      </button>
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
  );
}
