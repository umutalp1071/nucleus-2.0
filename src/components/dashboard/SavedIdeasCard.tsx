import { Card } from "./ui";
import type { Venture } from "@/lib/domain";
import { stageLabel } from "@/lib/stages";

// Export buttons return in Phase 04, rewired against Venture — see
// docs/plan/PHASE-04-venture-workspace.md.
export function SavedIdeasCard({ ventures }: { ventures: Venture[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Saved Ideas ({ventures.length})</h2>
      {ventures.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ideas you save from the analysis step will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ventures.map((venture) => (
            <li
              key={venture.id}
              className="rounded-md border border-border p-3 text-sm"
            >
              <p className="font-medium">{venture.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stageLabel(venture.stage)} · saved{" "}
                {new Date(venture.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
