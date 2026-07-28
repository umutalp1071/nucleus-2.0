export type ProjectStatus = "Live" | "Building" | "Paused";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  users?: number;
  revenuePerMonth?: number;
  progress: number;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
}

export interface GrowthMetric {
  id: string;
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
}

export const budget = { spent: 12, limit: 50 };

export const opportunitiesThisMonth = 7;

export const projects: Project[] = [
  {
    id: "langtutor-ai",
    name: "LangTutor AI",
    status: "Live",
    users: 847,
    revenuePerMonth: 210,
    progress: 78,
  },
  {
    id: "marketscout",
    name: "MarketScout",
    status: "Building",
    progress: 45,
  },
  {
    id: "recipe-remix",
    name: "Recipe Remix",
    status: "Paused",
    users: 112,
    revenuePerMonth: 0,
    progress: 20,
  },
];

export const recentActivity: ActivityItem[] = [
  { id: "1", text: "LangTutor AI deployed to production", time: "2h ago" },
  { id: "2", text: "MarketScout code review passed (82/100)", time: "5h ago" },
  { id: "3", text: "New opportunity flagged: AI resume screener", time: "1d ago" },
];

export const growthMetrics: GrowthMetric[] = [
  { id: "mrr", label: "MRR", value: "$210", trend: "up" },
  { id: "users", label: "Total Users", value: "959", trend: "up" },
  { id: "projects", label: "Active Projects", value: "3", trend: "flat" },
];

export const quickActions: QuickAction[] = [
  { id: "new-idea", label: "New Idea", icon: "💡" },
  { id: "view-budget", label: "View Budget", icon: "💰" },
  { id: "check-growth", label: "Check Growth", icon: "📈" },
];
