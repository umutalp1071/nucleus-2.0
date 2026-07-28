"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/settings/Sparkline";
import { formatUsd } from "@/lib/format";

interface SettingsData {
  hasKey: boolean;
  keyPreview: string | null;
  aiMode: "live" | "mock";
  caps: { daily: number; weekly: number; monthly: number };
  dataDir: string;
  backupCount: number;
}

interface Breakdown {
  byTask: { task: string; costUsd: number }[];
  byVenture: { ventureId: string; title: string; costUsd: number }[];
  byDay: { date: string; costUsd: number }[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);

  async function refresh() {
    const [settingsRes, breakdownRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/budget/breakdown"),
    ]);
    if (settingsRes.ok) setSettings(await settingsRes.json());
    if (breakdownRes.ok) setBreakdown(await breakdownRes.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6 sm:p-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Dashboard
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>

        {settings && <AiConnectionSection settings={settings} onChanged={refresh} />}
        {settings && <BudgetSection caps={settings.caps} onChanged={refresh} />}
        {breakdown && <SpendBreakdownSection breakdown={breakdown} />}
        {settings && <YourDataSection settings={settings} />}
        <DangerZoneSection onChanged={refresh} />
      </main>
    </div>
  );
}

function AiConnectionSection({
  settings,
  onChanged,
}: {
  settings: SettingsData;
  onChanged: () => void;
}) {
  const [key, setKey] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function testKey() {
    if (!key) return;
    setBusy(true);
    setTestResult(null);
    const res = await fetch("/api/settings/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    setTestResult(await res.json());
    setBusy(false);
  }

  async function saveKey() {
    if (!key) return;
    setBusy(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    setKey("");
    setTestResult(null);
    setBusy(false);
    onChanged();
  }

  async function removeKey() {
    setBusy(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: null }),
    });
    setBusy(false);
    onChanged();
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">AI connection</h2>
        <Badge tone={settings.aiMode === "live" ? "positive" : "neutral"}>
          {settings.aiMode === "live" ? "Live" : "Demo mode"}
        </Badge>
      </div>
      {settings.hasKey ? (
        <p className="text-sm text-muted-foreground">
          Using key <span className="font-mono">{settings.keyPreview}</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No key configured -- Nucleus is showing example AI results. Add an OpenRouter key to
          analyze real ideas (about $0.01-0.15 per venture, depending on the stage).
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-or-..."
          className="flex-1 rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={testKey}
            disabled={!key || busy}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            Test
          </button>
          <button
            onClick={saveKey}
            disabled={!key || busy}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
      {testResult && (
        <p className={`text-sm ${testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {testResult.message}
        </p>
      )}
      {settings.hasKey && (
        <button
          onClick={removeKey}
          disabled={busy}
          className="self-start text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
        >
          Remove key and return to demo mode
        </button>
      )}
    </Card>
  );
}

function BudgetSection({
  caps,
  onChanged,
}: {
  caps: SettingsData["caps"];
  onChanged: () => void;
}) {
  const [daily, setDaily] = useState(String(caps.daily));
  const [weekly, setWeekly] = useState(String(caps.weekly));
  const [monthly, setMonthly] = useState(String(caps.monthly));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsed = { daily: Number(daily), weekly: Number(weekly), monthly: Number(monthly) };
    if (!(parsed.daily > 0 && parsed.weekly > 0 && parsed.monthly > 0)) {
      setError("Caps must be greater than zero.");
      return;
    }
    if (!(parsed.daily <= parsed.weekly && parsed.weekly <= parsed.monthly)) {
      setError("Caps must satisfy daily ≤ weekly ≤ monthly.");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caps: parsed }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save those caps.");
      return;
    }
    onChanged();
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Budget</h2>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Daily
          <input
            type="number"
            min={0}
            step="0.01"
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className="rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Weekly
          <input
            type="number"
            min={0}
            step="0.01"
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
            className="rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Monthly
          <input
            type="number"
            min={0}
            step="0.01"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            className="rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        onClick={save}
        disabled={busy}
        className="self-start rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        Save caps
      </button>
    </Card>
  );
}

function SpendBreakdownSection({ breakdown }: { breakdown: Breakdown }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-semibold">Spend breakdown</h2>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Last 30 days</p>
        <Sparkline data={breakdown.byDay} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">By task</p>
          {breakdown.byTask.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spend yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {breakdown.byTask.map((row) => (
                <li key={row.task} className="flex justify-between">
                  <span className="text-muted-foreground">{row.task}</span>
                  <span className="font-medium">{formatUsd(row.costUsd)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">By venture</p>
          {breakdown.byVenture.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spend yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {breakdown.byVenture.map((row) => (
                <li key={row.ventureId} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">{row.title}</span>
                  <span className="shrink-0 font-medium">{formatUsd(row.costUsd)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function YourDataSection({ settings }: { settings: SettingsData }) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="font-semibold">Your data</h2>
      <p className="text-sm text-muted-foreground">
        Everything Nucleus knows lives in plain JSON files on this computer, at:
      </p>
      <p className="rounded-md border border-border bg-secondary/40 p-2 font-mono text-xs">
        {settings.dataDir}
      </p>
      <p className="text-xs text-muted-foreground">
        {settings.backupCount} automatic backup{settings.backupCount === 1 ? "" : "s"} kept.
      </p>
      <p className="text-xs text-muted-foreground">
        Export a full copy anytime from the dashboard&apos;s Quick Actions.
      </p>
    </Card>
  );
}

function DangerZoneSection({ onChanged }: { onChanged: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clearCache() {
    setBusy(true);
    await fetch("/api/settings/clear-cache", { method: "POST" });
    setBusy(false);
    setMessage("Cache cleared.");
  }

  async function deleteAll() {
    if (confirmText !== "DELETE") return;
    setBusy(true);
    await fetch("/api/settings/delete-all", { method: "POST" });
    setBusy(false);
    setConfirmText("");
    setMessage("All data deleted.");
    onChanged();
  }

  return (
    <Card className="flex flex-col gap-3 border-destructive/30">
      <h2 className="font-semibold text-destructive">Danger zone</h2>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Clear the AI response cache. Safe -- nothing you&apos;ve saved is affected.
        </p>
        <button
          onClick={clearCache}
          disabled={busy}
          className="shrink-0 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          Clear cache
        </button>
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-sm text-muted-foreground">
          Delete every venture, artifact, event, and setting. This cannot be undone. Type{" "}
          <span className="font-mono">DELETE</span> to confirm.
        </p>
        <div className="flex gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="flex-1 rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={deleteAll}
            disabled={confirmText !== "DELETE" || busy}
            className="shrink-0 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            Delete all data
          </button>
        </div>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </Card>
  );
}
