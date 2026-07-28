import { STAGE_ORDER, stageLabel } from "@/lib/stages";
import type { Stage } from "@/lib/domain";

// killed and archived render as distinct terminal branches, not part of the
// forward timeline -- killed especially should read as muted, not red.
// Killing an idea early is a win, and the UI should not shame it.
export function StageTimeline({ stage }: { stage: Stage }) {
  if (stage === "killed") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
        Killed -- a deliberate stop, not a failure.
      </div>
    );
  }

  if (stage === "archived") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden />
        Archived.
      </div>
    );
  }

  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {STAGE_ORDER.map((s, i) => {
        const isPast = i < currentIndex;
        const isCurrent = s === stage;
        return (
          <div key={s} className="flex items-center gap-2">
            <span
              className={
                isCurrent
                  ? "flex items-center gap-1.5 font-semibold text-foreground"
                  : isPast
                  ? "flex items-center gap-1.5 text-foreground"
                  : "flex items-center gap-1.5 text-muted-foreground"
              }
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isCurrent ? "bg-primary" : isPast ? "bg-foreground" : "bg-muted"
                }`}
                aria-hidden
              />
              {stageLabel(s)}
            </span>
            {i < STAGE_ORDER.length - 1 && <span className="text-muted-foreground">&mdash;</span>}
          </div>
        );
      })}
    </div>
  );
}
