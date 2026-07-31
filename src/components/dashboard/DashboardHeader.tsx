import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { formatUsd } from "@/lib/format";
import { isApproaching } from "@/lib/budgetStatus";

interface Spend {
  daily: number;
  weekly: number;
  monthly: number;
}

export function DashboardHeader({ spend, caps }: { spend: Spend; caps: Spend }) {
  const approaching = isApproaching(spend, caps);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden>🧠</span>
        <span>Nucleus OS v2.0</span>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <a
          href="#budget"
          title={approaching ? "Approaching a spending limit -- check Budget below" : undefined}
          className={`rounded-full px-3 py-1 text-sm font-medium hover:opacity-80 ${
            approaching
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          💰 {formatUsd(spend.monthly)}/${caps.monthly}
        </a>
        <Link href="/content" className="text-sm font-medium hover:opacity-80">
          ✍️ Content
        </Link>
        <ThemeToggle />
        <button
          aria-label="Notifications"
          className="text-lg leading-none hover:opacity-70"
        >
          🔔
        </button>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground hover:opacity-90"
        >
          👤
        </Link>
      </div>
    </header>
  );
}
