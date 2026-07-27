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
  type IdeaAnalysis,
} from "@/lib/mock-data";
import { getSavedIdeas, saveIdea, type SavedIdea } from "@/lib/idea-storage";

export default function Home() {
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSavedIdeas(getSavedIdeas());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSaveIdea(idea: string, analysis: IdeaAnalysis) {
    setSavedIdeas(saveIdea(idea, analysis));
  }

  function handleContinue() {
    setToast("Taking you to project creation...");
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader budgetSpent={budget.spent} budgetLimit={budget.limit} />
      <main className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <NewIdeaCard
            opportunities={opportunitiesThisMonth}
            onSaveIdea={handleSaveIdea}
            onContinue={handleContinue}
          />
          <ActiveProjectsCard projects={projects} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RecentActivityCard activity={recentActivity} />
          <GrowthCard metrics={growthMetrics} />
          <QuickActionsCard actions={quickActions} />
        </div>
        <SavedIdeasCard ideas={savedIdeas} />
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
