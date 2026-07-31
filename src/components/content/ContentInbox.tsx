"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/dashboard/ui";

interface VentureOption {
  id: string;
  title: string;
}

// Mirrors src/server/content/drafts.ts's DraftFile -- not imported directly,
// since a "use client" component may never import from @/server (enforced
// by tests/boundaries.test.ts).
interface DraftFile {
  filename: string;
  content: string;
}

export function ContentInbox({
  ventures,
  drafts,
  voiceSources,
  initialVoiceSamples,
}: {
  ventures: VentureOption[];
  drafts: DraftFile[];
  voiceSources: string[];
  initialVoiceSamples: string[];
}) {
  const router = useRouter();
  const [ventureId, setVentureId] = useState(ventures[0]?.id ?? "");
  const [genBusy, setGenBusy] = useState<"venture" | "self" | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [voiceSamples, setVoiceSamples] = useState<string[]>(initialVoiceSamples);
  const [voiceBusy, setVoiceBusy] = useState(false);

  async function generate(mode: "venture" | "self") {
    setGenBusy(mode);
    setGenError(null);
    const body = mode === "venture" ? { mode, ventureId } : { mode };
    const res = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setGenBusy(null);
    if (!res.ok) {
      const resBody = await res.json().catch(() => ({}));
      setGenError(resBody.error ?? "Couldn't generate a draft. Try again.");
      return;
    }
    router.refresh();
  }

  function toggleVoiceSample(path: string) {
    setVoiceSamples((current) => {
      if (current.includes(path)) return current.filter((p) => p !== path);
      if (current.length >= 3) return current;
      return [...current, path];
    });
  }

  async function saveVoiceSamples() {
    setVoiceBusy(true);
    await fetch("/api/content/voice-samples", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: voiceSamples }),
    });
    setVoiceBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Dashboard
      </Link>

      <Card className="flex flex-col gap-3">
        <h1 className="font-semibold">Generate a draft</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ventureId}
            onChange={(e) => setVentureId(e.target.value)}
            disabled={ventures.length === 0}
            className="rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {ventures.length === 0 && <option>No ventures yet</option>}
            {ventures.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => generate("venture")}
            disabled={genBusy !== null || !ventureId}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {genBusy === "venture" ? "Writing..." : "Generate for this venture"}
          </button>
        </div>
        <div className="border-t border-border pt-3">
          <button
            onClick={() => generate("self")}
            disabled={genBusy !== null}
            className="self-start rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {genBusy === "self" ? "Writing..." : "Generate about Nucleus itself"}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Reads this project&apos;s own git log, PROGRESS.md, and learning.md -- Nucleus writing about Nucleus.
          </p>
        </div>
        {genError && <p className="text-xs text-destructive">{genError}</p>}
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">Voice samples</h2>
        <p className="text-xs text-muted-foreground">
          Pick up to 3 of your own published posts to calibrate tone. New drafts are written to match these, never a
          tone slider.
        </p>
        {voiceSources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts on file yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {voiceSources.map((path) => (
              <li key={path} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={voiceSamples.includes(path)}
                  onChange={() => toggleVoiceSample(path)}
                  disabled={!voiceSamples.includes(path) && voiceSamples.length >= 3}
                  className="h-4 w-4 rounded border-border"
                />
                <span>{path}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={saveVoiceSamples}
          disabled={voiceBusy}
          className="self-start rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {voiceBusy ? "Saving..." : "Save voice samples"}
        </button>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="font-semibold">Drafts ({drafts.length})</h2>
        {drafts.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">No drafts yet -- generate one above.</p>
          </Card>
        ) : (
          drafts.map((draft) => <DraftCard key={draft.filename} draft={draft} onChanged={() => router.refresh()} />)
        )}
      </div>
    </div>
  );
}

function DraftCard({ draft, onChanged }: { draft: DraftFile; onChanged: () => void }) {
  const [content, setContent] = useState(draft.content);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);

  async function save() {
    setBusy("save");
    await fetch(`/api/content/drafts/${encodeURIComponent(draft.filename)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setBusy(null);
    setDirty(false);
  }

  async function approve() {
    setBusy("approve");
    await fetch(`/api/content/drafts/${encodeURIComponent(draft.filename)}/approve`, { method: "POST" });
    setBusy(null);
    onChanged();
  }

  async function reject() {
    if (!reason.trim()) return;
    setBusy("reject");
    await fetch(`/api/content/drafts/${encodeURIComponent(draft.filename)}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    setBusy(null);
    onChanged();
  }

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{draft.filename}</p>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        rows={10}
        className="w-full rounded-md border border-border bg-background p-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={!dirty || busy !== null}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {busy === "save" ? "Saving..." : "Save edits"}
        </button>
        <button
          onClick={copy}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? "Copied!" : "Copy for Peerlist"}
        </button>
        <button
          onClick={approve}
          disabled={busy !== null}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy === "approve" ? "Approving..." : "Approve"}
        </button>
        <button
          onClick={() => setRejecting((r) => !r)}
          disabled={busy !== null}
          className="rounded-md border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {rejecting && (
        <div className="flex items-center gap-2 border-t border-border pt-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="One-line reason -- feeds the next generation"
            className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={reject}
            disabled={!reason.trim() || busy !== null}
            className="shrink-0 rounded-md border border-destructive/40 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy === "reject" ? "..." : "Confirm reject"}
          </button>
        </div>
      )}
    </Card>
  );
}
