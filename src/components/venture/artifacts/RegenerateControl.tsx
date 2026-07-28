"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// A regeneration is a normal budgeted gateway call, versioned by createdAt --
// the previous artifact is never overwritten. router.refresh() re-fetches the
// (server-component) workspace page, which then shows the newest version.
export function RegenerateControl({
  ventureId,
  kind,
}: {
  ventureId: string;
  kind: "plan" | "mvp_scope";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!feedback.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/ventures/${ventureId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, feedback }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't regenerate that. Try again.");
      return;
    }
    setOpen(false);
    setFeedback("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start text-xs text-muted-foreground underline hover:text-foreground"
      >
        Not quite -- tell Nucleus why
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2">
      <textarea
        autoFocus
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="What's wrong with this? Be specific."
        rows={2}
        className="w-full resize-none rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !feedback.trim()}
          className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
    </div>
  );
}
