import { Card } from "./ui";
import { NewIdeaFlow } from "./NewIdeaFlow";

export function NewIdeaCard({
  opportunities,
  onChanged,
  onContinue,
  onKilled,
  onSaved,
}: {
  opportunities: number;
  onChanged?: () => void;
  onContinue?: () => void;
  onKilled?: () => void;
  onSaved?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <NewIdeaFlow onChanged={onChanged} onContinue={onContinue} onKilled={onKilled} onSaved={onSaved} />
        <p className="text-xs text-muted-foreground">
          Turn a thought into a venture
        </p>
      </Card>
      <Card className="text-center">
        <p className="text-2xl font-bold">{opportunities}</p>
        <p className="text-xs text-muted-foreground">
          AI opportunities this month
        </p>
      </Card>
    </div>
  );
}
