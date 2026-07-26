import type { ReactNode } from "react";
import type { ProjectStatus } from "@/lib/mock-data";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-card-foreground p-5 ${className}`}
    >
      {children}
    </div>
  );
}

const statusStyles: Record<ProjectStatus, string> = {
  Live: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Building: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Paused: "bg-muted text-muted-foreground",
};

export function Badge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className="h-1.5 rounded-full bg-primary transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
