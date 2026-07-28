import type { Competitors } from "@/lib/domain";

export function CompetitorsArtifact({ competitors }: { competitors: Competitors }) {
  return (
    <div className="rounded-md border border-border p-3 text-sm">
      <p className="font-medium">
        Competitors ({competitors.competitors.length}) &middot; {competitors.crowdedness} crowdedness
      </p>
      <p className="mt-2 text-muted-foreground">{competitors.differentiationVerdict}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {competitors.competitors.map((c) => (
          <li key={c.name} className="rounded-md border border-border p-2">
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.whatTheyDo}</p>
            <p className="mt-1 text-xs">
              <span className="text-muted-foreground">Weakness: </span>
              {c.weakness}
            </p>
            <p className="mt-1 text-xs">
              <span className="text-muted-foreground">How you win: </span>
              {c.howYouWin}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
