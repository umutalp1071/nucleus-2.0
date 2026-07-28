"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewIdeaCard } from "@/components/dashboard/NewIdeaCard";
import { VenturesCard } from "@/components/dashboard/VenturesCard";
import { RecentActivityCard, BudgetCard, QuickActionsCard } from "@/components/dashboard/BottomRow";
import { exportVenturesAsJSON } from "@/lib/idea-export";
import type { Venture, NucleusEvent, Artifact } from "@/lib/domain";

const LEGACY_STORAGE_KEY = "nucleus:saved-ideas";

interface Spend {
  daily: number;
  weekly: number;
  monthly: number;
}

function titleFromIdea(idea: string): string {
  const oneLine = idea.trim().split("\n")[0];
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine;
}

async function createVenture(idea: string): Promise<void> {
  await fetch("/api/ventures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: titleFromIdea(idea), description: idea }),
  });
}

// One-time move of ideas saved before Phase 01 introduced the real venture
// store. Idempotent: clears the legacy key as soon as it's read, so a second
// mount (or a second tab) never double-migrates.
async function migrateLegacyIdeas(): Promise<number> {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return 0;
  localStorage.removeItem(LEGACY_STORAGE_KEY);

  let legacy: Array<{ idea: string }> = [];
  try {
    legacy = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (legacy.length === 0) return 0;

  for (const item of legacy) {
    await createVenture(item.idea);
  }
  return legacy.length;
}

const ZERO_SPEND: Spend = { daily: 0, weekly: 0, monthly: 0 };
const DEFAULT_CAPS: Spend = { daily: 10, weekly: 30, monthly: 50 };

export default function Home() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [events, setEvents] = useState<NucleusEvent[]>([]);
  const [spend, setSpend] = useState<Spend>(ZERO_SPEND);
  const [caps, setCaps] = useState<Spend>(DEFAULT_CAPS);
  const [toast, setToast] = useState<string | null>(null);

  async function refreshVentures() {
    const res = await fetch("/api/ventures");
    if (res.ok) setVentures(await res.json());
  }

  async function refreshEvents() {
    const res = await fetch("/api/events?limit=10");
    if (res.ok) setEvents(await res.json());
  }

  async function refreshBudget() {
    const res = await fetch("/api/budget");
    if (res.ok) {
      const body = await res.json();
      setSpend(body.spend);
      setCaps(body.caps);
    }
  }

  function refreshAll() {
    refreshVentures();
    refreshEvents();
    refreshBudget();
  }

  useEffect(() => {
    (async () => {
      const migrated = await migrateLegacyIdeas();
      refreshAll();
      if (migrated > 0) {
        setToast(`Moved ${migrated} saved idea${migrated === 1 ? "" : "s"} into Nucleus.`);
      }
    })();
    // Intentionally mount-only -- refreshAll's identity changes every render
    // but this effect only ever needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleContinue() {
    setToast("Taking you to project creation...");
  }

  function handleKilled() {
    setToast("Killed -- saved time before writing a line of code.");
    refreshAll();
  }

  function handleSaved() {
    setToast("Saved to your ventures.");
  }

  async function handleExport() {
    const [venturesRes, artifactsRes] = await Promise.all([
      fetch("/api/ventures"),
      fetch("/api/artifacts"),
    ]);
    const allVentures: Venture[] = venturesRes.ok ? await venturesRes.json() : [];
    const allArtifacts: Artifact[] = artifactsRes.ok ? await artifactsRes.json() : [];
    exportVenturesAsJSON(allVentures, allArtifacts);
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader budgetSpent={spend.monthly} budgetLimit={caps.monthly} />
      <main className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <NewIdeaCard
            opportunities={ventures.filter((v) => v.stage !== "archived" && v.stage !== "killed").length}
            onChanged={refreshAll}
            onContinue={handleContinue}
            onKilled={handleKilled}
            onSaved={handleSaved}
          />
          <VenturesCard ventures={ventures} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RecentActivityCard events={events} />
          <BudgetCard spend={spend} caps={caps} />
          <QuickActionsCard onExport={handleExport} />
        </div>
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
