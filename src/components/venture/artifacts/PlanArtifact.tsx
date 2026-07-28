import type { Plan } from "@/lib/domain";

export function PlanArtifact({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col gap-4">
      {/* The positioning one-liner is the single sentence a founder should
          remember from this whole artifact -- set apart as a pull quote,
          not just another list item. */}
      <blockquote className="border-l-2 border-primary pl-3 text-lg font-semibold italic">
        &ldquo;{plan.positioning.oneLiner}&rdquo;
      </blockquote>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="font-medium">{plan.positioning.category}</p>
        </div>
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Wedge -- the narrow first win</p>
          <p className="font-medium">{plan.positioning.wedge}</p>
        </div>
      </div>

      <div className="rounded-md border border-border p-3 text-sm">
        <p className="text-xs text-muted-foreground">Who, and where to find them</p>
        <p className="mt-1 font-medium">{plan.icp.who}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {plan.icp.where.map((channel) => (
            <span
              key={channel}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {channel}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Today they use: <span className="text-foreground">{plan.icp.currentSolution}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Switch trigger: <span className="text-foreground">{plan.icp.switchTrigger}</span>
        </p>
      </div>

      <div className="text-sm">
        <p className="mb-1 text-xs text-muted-foreground">Differentiation</p>
        <ul className="flex flex-col gap-1">
          {plan.differentiation.map((d, i) => (
            <li key={i} className="rounded-md border border-border p-2">
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">First 10 users</p>
        <p className="font-medium">{plan.firstTenUsers}</p>
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Success metric</p>
        <p className="font-medium">
          {plan.successMetric.metric}: {plan.successMetric.target} by {plan.successMetric.by}
        </p>
      </div>

      {/* Same treatment as Verdict.whyNot -- the stopping condition is the
          most important field here and should read that way. */}
      <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
        <p className="font-medium">When to stop</p>
        <p className="mt-1 text-muted-foreground">{plan.killCriteria}</p>
      </div>
    </div>
  );
}
