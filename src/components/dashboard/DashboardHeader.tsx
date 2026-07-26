export function DashboardHeader({
  budgetSpent,
  budgetLimit,
}: {
  budgetSpent: number;
  budgetLimit: number;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden>🧠</span>
        <span>Nucleus OS v2.0</span>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          💰 ${budgetSpent}/${budgetLimit}
        </span>
        <button
          aria-label="Notifications"
          className="text-lg leading-none hover:opacity-70"
        >
          🔔
        </button>
        <div
          aria-label="User avatar"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground"
        >
          👤
        </div>
      </div>
    </header>
  );
}
