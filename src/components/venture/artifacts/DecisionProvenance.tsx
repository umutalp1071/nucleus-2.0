import { Badge } from "@/components/dashboard/ui";
import { formatUsd } from "@/lib/format";
import type { Decision } from "@/lib/domain";

// "This verdict came from claude-haiku-4.5, downgraded from frontier, cost
// $0.03, fed by artifacts a1, a2, and you accepted it" -- the Definition of
// Done from docs/reviews/2026-07-30-stack-position.md §8, made literal.
export function DecisionProvenance({ decision }: { decision: Decision | null }) {
  if (!decision) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
      <span>{decision.modelId === "unknown" ? "model unknown -- predates tracking" : decision.modelId}</span>
      {decision.downgraded && <Badge tone="warning">downgraded</Badge>}
      {decision.cached && <Badge tone="neutral">cached</Badge>}
      <span>{formatUsd(decision.costUsd)}</span>
      {decision.inputRefs.length > 0 && (
        <span>
          fed by {decision.inputRefs.length} artifact{decision.inputRefs.length === 1 ? "" : "s"}
        </span>
      )}
      {decision.humanVerdict !== "pending" && (
        <span>
          you {decision.humanVerdict}
          {decision.humanReason ? `: "${decision.humanReason}"` : ""}
        </span>
      )}
    </div>
  );
}
