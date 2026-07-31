import type { Calendar } from "@/lib/domain";

export function ContentCalendarArtifact({ calendar }: { calendar: Calendar }) {
  return (
    <div className="flex flex-col gap-4">
      <blockquote className="border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">
        <span className="font-medium not-italic text-foreground">{calendar.strategy}</span>
      </blockquote>

      <div className="text-sm">
        <p className="mb-1 text-xs text-muted-foreground">Channels</p>
        <ul className="flex flex-col gap-1">
          {calendar.channels.map((c, i) => (
            <li key={i} className="rounded-md border border-border p-2">
              <p className="flex items-baseline justify-between">
                <span className="font-medium">{c.channel}</span>
                <span className="text-xs text-muted-foreground">{c.cadence}</span>
              </p>
              <p className="text-xs text-muted-foreground">{c.why}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-sm">
        <p className="mb-1 text-xs text-muted-foreground">{calendar.posts.length}-post calendar</p>
        <ol className="flex flex-col gap-2">
          {[...calendar.posts]
            .sort((a, b) => a.day - b.day)
            .map((p) => (
              <li key={p.day} className="rounded-md border border-border p-2">
                <p className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>
                    Day {p.day} &middot; {p.channel} &middot; {p.type}
                  </span>
                </p>
                <p className="font-medium">&ldquo;{p.hook}&rdquo;</p>
                <p className="text-xs text-muted-foreground">{p.angle}</p>
              </li>
            ))}
        </ol>
      </div>
    </div>
  );
}
