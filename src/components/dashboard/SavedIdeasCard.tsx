import { Card } from "./ui";
import type { SavedIdea } from "@/lib/idea-storage";
import { exportIdeasAsCSV, exportIdeasAsJSON } from "@/lib/idea-export";

export function SavedIdeasCard({ ideas }: { ideas: SavedIdea[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Saved Ideas ({ideas.length})</h2>
        {ideas.length > 0 && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => exportIdeasAsJSON(ideas)}
              className="rounded-md border border-border px-2 py-1 font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportIdeasAsCSV(ideas)}
              className="rounded-md border border-border px-2 py-1 font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>
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
