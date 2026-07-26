import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewIdeaCard } from "@/components/dashboard/NewIdeaCard";
import { ActiveProjectsCard } from "@/components/dashboard/ActiveProjectsCard";
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

export default function Home() {
  return (
    <div className="min-h-screen">
      <DashboardHeader budgetSpent={budget.spent} budgetLimit={budget.limit} />
      <main className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <NewIdeaCard opportunities={opportunitiesThisMonth} />
          <ActiveProjectsCard projects={projects} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <RecentActivityCard activity={recentActivity} />
          <GrowthCard metrics={growthMetrics} />
          <QuickActionsCard actions={quickActions} />
        </div>
      </main>
    </div>
  );
}
