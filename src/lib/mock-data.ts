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

export interface IdeaAnalysis {
  marketSize: string;
  competition: string;
  estimatedCost: string;
  revenueOpportunity: string;
}

// ponytail: heuristic mock keyed off idea length, not real analysis. Swap for a real API call later.
export function generateMockAnalysis(idea: string): IdeaAnalysis {
  const wordCount = idea.trim().split(/\s+/).filter(Boolean).length;
  const tier = wordCount > 15 ? "large" : wordCount > 6 ? "medium" : "small";

  const marketSize = {
    small: "$50M–$200M niche market",
    medium: "$200M–$800M growing market",
    large: "$800M+ established market",
  }[tier];

  const estimatedCost = {
    small: "$500–$2,000 to MVP",
    medium: "$2,000–$8,000 to MVP",
    large: "$8,000–$20,000 to MVP",
  }[tier];

  const revenueOpportunity = {
    small: "$1K–$5K MRR potential in year 1",
    medium: "$5K–$20K MRR potential in year 1",
    large: "$20K+ MRR potential in year 1",
  }[tier];

  const competition =
    wordCount % 2 === 0
      ? "Moderate — 3-5 established players"
      : "Low — fragmented, no clear leader";

  return { marketSize, competition, estimatedCost, revenueOpportunity };
}
