import { Card } from "./ui";
import type { SavedIdea } from "@/lib/idea-storage";

export function SavedIdeasCard({ ideas }: { ideas: SavedIdea[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Saved Ideas ({ideas.length})</h2>
      {ideas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ideas you save from the analysis step will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ideas.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border p-3 text-sm"
            >
              <p className="font-medium">{item.idea}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.analysis.marketSize} · saved{" "}
                {new Date(item.savedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
