import type { Verdict } from "@/lib/domain";

const severityColor: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-destructive",
};

const recommendationBadge: Record<Verdict["recommendation"], string> = {
  build: "bg-primary text-primary-foreground",
  refine: "bg-secondary text-secondary-foreground",
  kill: "bg-destructive/10 text-destructive",
};

const recommendationLabel: Record<Verdict["recommendation"], string> = {
  build: "BUILD",
  refine: "REFINE",
  kill: "KILL",
};

// Renders a validate-idea verdict. Shared between the New Idea modal and the
// venture workspace so they never drift -- one rendering, two call sites.
export function ValidationArtifact({ verdict }: { verdict: Verdict }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{verdict.headline}</h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${recommendationBadge[verdict.recommendation]}`}
        >
          {verdict.score}/100 &middot; {recommendationLabel[verdict.recommendation]}
        </span>
      </div>

      {/* Above the fold, on purpose -- honesty is the product's promise. */}
      <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
        <p className="font-medium">Why not?</p>
        <p className="mt-1 text-muted-foreground">{verdict.whyNot}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Market size</p>
          <p className="font-medium">{verdict.marketSize.estimate}</p>
        </div>
        <div className="rounded-md border border-border p-2">
          <p className="text-xs text-muted-foreground">Audience pain level</p>
          <p className="font-medium capitalize">{verdict.audience.painLevel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <p className="text-xs text-muted-foreground">Risks</p>
        {verdict.risks.map((r, i) => (
          <div key={i} className="flex justify-between gap-2 rounded-md border border-border p-2">
            <span>{r.risk}</span>
            <span className={`shrink-0 text-xs font-medium uppercase ${severityColor[r.severity]}`}>
              {r.severity}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Cheapest test before building anything</p>
        <p className="font-medium">{verdict.cheapestTest}</p>
      </div>

      <div className="rounded-md border border-border p-2 text-sm">
        <p className="text-xs text-muted-foreground">Moat</p>
        <p className="font-medium">{verdict.moat}</p>
      </div>
    </div>
  );
}
