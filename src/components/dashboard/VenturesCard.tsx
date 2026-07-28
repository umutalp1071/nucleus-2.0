import Link from "next/link";
import { Card, Badge } from "./ui";
import type { Venture } from "@/lib/domain";
import { stageLabel, stageTone } from "@/lib/stages";
import { relativeTime } from "@/lib/format";

export function VenturesCard({ ventures }: { ventures: Venture[] }) {
  const visible = ventures.filter((v) => v.stage !== "archived");

  return (
    <Card className="flex h-full flex-col gap-3">
      <h2 className="font-semibold">Ventures ({visible.length})</h2>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Describe an idea above and Nucleus will tell you what it thinks --
          including when to walk away.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((venture) => (
            <Link
              key={venture.id}
              href={`/ventures/${venture.id}`}
              className="block rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{venture.title}</span>
                <Badge tone={stageTone(venture.stage)}>{stageLabel(venture.stage)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {venture.verdictScore !== null ? `Scored ${venture.verdictScore}/100 · ` : ""}
                {relativeTime(venture.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
