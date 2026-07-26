import { Card } from "./ui";
import type { ActivityItem, GrowthMetric, QuickAction } from "@/lib/mock-data";

const trendIcon = { up: "↑", down: "↓", flat: "→" } as const;

export function RecentActivityCard({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Recent Activity</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {activity.map((item) => (
          <li key={item.id} className="flex justify-between gap-2">
            <span>{item.text}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function GrowthCard({ metrics }: { metrics: GrowthMetric[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Growth</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {metrics.map((metric) => (
          <li key={metric.id} className="flex items-center justify-between">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-medium">
              {metric.value} <span aria-hidden>{trendIcon[metric.trend]}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function QuickActionsCard({ actions }: { actions: QuickAction[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <span aria-hidden>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
