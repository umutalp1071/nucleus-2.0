import type { MvpScope } from "@/lib/domain";

export function MvpScopeArtifact({ scope }: { scope: MvpScope }) {
  const totalDays = scope.milestones.reduce((sum, m) => sum + m.estimateDays, 0);

  return (
    <div className="flex flex-col gap-4">
      <blockquote className="border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
        The core loop: <span className="font-medium not-italic text-foreground">{scope.coreLoop}</span>
      </blockquote>

      <div className="text-sm">
        <p className="mb-1 text-xs text-muted-foreground">Must have</p>
        <ul className="flex flex-col gap-1">
          {scope.mustHave.map((f, i) => (
            <li key={i} className="rounded-md border border-border p-2">
              <p className="font-medium">{f.feature}</p>
              <p className="text-xs text-muted-foreground">{f.why}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* The cuts are the most valuable field here -- struck through and
          muted so it reads as "deliberately removed," not "more features." */}
      <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
        <p className="mb-1 font-medium">Explicitly not in v1</p>
        <ul className="flex flex-col gap-1">
          {scope.explicitlyNot.map((item, i) => (
            <li key={i} className="text-muted-foreground line-through decoration-muted-foreground/60">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm">
        <p className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
          <span>Milestones</span>
          <span>{totalDays} days total</span>
        </p>
        <ol className="flex flex-col gap-2">
          {scope.milestones.map((m, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-border p-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-medium">
                  {m.name} <span className="text-xs font-normal text-muted-foreground">&middot; {m.estimateDays}d</span>
                </p>
                <p className="text-xs text-muted-foreground">{m.outcome}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Stack</p>
        <p className="font-medium">{scope.stack.recommendation}</p>
        <p className="mt-1 text-xs text-muted-foreground">{scope.stack.reasoning}</p>
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Riskiest assumption</p>
        <p className="font-medium">{scope.riskiestAssumption}</p>
      </div>
    </div>
  );
}
