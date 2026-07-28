import { Card } from "./ui";
import type { NucleusEvent } from "@/lib/domain";
import { relativeTime, formatUsd } from "@/lib/format";

export function RecentActivityCard({ events }: { events: NucleusEvent[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Recent Activity</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet -- start with an idea.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {events.map((event) => (
            <li key={event.id} className="flex justify-between gap-2">
              <span>{event.summary}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

interface Spend {
  daily: number;
  weekly: number;
  monthly: number;
}

export function BudgetCard({ spend, caps }: { spend: Spend; caps: Spend }) {
  const rows: [string, number, number][] = [
    ["Today", spend.daily, caps.daily],
    ["This week", spend.weekly, caps.weekly],
    ["This month", spend.monthly, caps.monthly],
  ];
  return (
    <Card id="budget" className="flex flex-col gap-3">
      <h2 className="font-semibold">Budget</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {rows.map(([label, spent, cap]) => (
          <li key={label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">
              {formatUsd(spent)} / ${cap}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function QuickActionsCard({ onExport }: { onExport: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span aria-hidden>⬇️</span>
          Export Ventures
        </button>
        <a
          href="#budget"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span aria-hidden>💰</span>
          View Budget
        </a>
      </div>
    </Card>
  );
}
