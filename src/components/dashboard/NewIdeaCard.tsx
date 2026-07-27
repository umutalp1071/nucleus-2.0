import { Card } from "./ui";
import { NewIdeaFlow } from "./NewIdeaFlow";
import type { IdeaAnalysis } from "@/lib/mock-data";

export function NewIdeaCard({
  opportunities,
  onSaveIdea,
  onContinue,
}: {
  opportunities: number;
  onSaveIdea?: (idea: string, analysis: IdeaAnalysis) => void;
  onContinue?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <NewIdeaFlow onSaveIdea={onSaveIdea} onContinue={onContinue} />
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
