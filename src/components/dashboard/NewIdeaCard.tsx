import { Card } from "./ui";
import { NewIdeaFlow } from "./NewIdeaFlow";

export function NewIdeaCard({ opportunities }: { opportunities: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <NewIdeaFlow />
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
