"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewIdeaCard } from "@/components/dashboard/NewIdeaCard";
import { ActiveProjectsCard } from "@/components/dashboard/ActiveProjectsCard";
import { SavedIdeasCard } from "@/components/dashboard/SavedIdeasCard";
import {
  RecentActivityCard,
  GrowthCard,
  QuickActionsCard,
} from "@/components/dashboard/BottomRow";
import {
  budget,
  opportunitiesThisMonth,
  projects,
  recentActivity,
  growthMetrics,
  quickActions,
} from "@/lib/mock-data";
import type { Venture } from "@/lib/domain";

const LEGACY_STORAGE_KEY = "nucleus:saved-ideas";

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

export default function Home() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  async function refreshVentures() {
    const res = await fetch("/api/ventures");
    if (res.ok) setVentures(await res.json());
  }

  useEffect(() => {
    (async () => {
      const migrated = await migrateLegacyIdeas();
      await refreshVentures();
      if (migrated > 0) {
        setToast(`Moved ${migrated} saved idea${migrated === 1 ? "" : "s"} into Nucleus.`);
      }
    })();
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
  }

  function handleSaved() {
    setToast("Saved to your ventures.");
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader budgetSpent={budget.spent} budgetLimit={budget.limit} />
      <main className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <NewIdeaCard
            opportunities={opportunitiesThisMonth}
            onChanged={refreshVentures}
            onContinue={handleContinue}
            onKilled={handleKilled}
            onSaved={handleSaved}
          />
          <ActiveProjectsCard projects={projects} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RecentActivityCard activity={recentActivity} />
          <GrowthCard metrics={growthMetrics} />
          <QuickActionsCard actions={quickActions} />
        </div>
        <SavedIdeasCard ventures={ventures} />
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
