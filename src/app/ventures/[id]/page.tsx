import { notFound } from "next/navigation";
import Link from "next/link";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifactsRepo from "@/server/db/repositories/artifacts";
import * as aiCallsRepo from "@/server/db/repositories/aiCalls";
import { Card, Badge } from "@/components/dashboard/ui";
import { StageTimeline } from "@/components/venture/StageTimeline";
import { VentureActions } from "@/components/venture/VentureActions";
import { ArtifactRenderer } from "@/components/venture/artifacts";
import { stageLabel, stageTone } from "@/lib/stages";
import { formatUsd, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VentureWorkspace({ params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) notFound();

  const [artifacts, spend] = await Promise.all([
    artifactsRepo.listByVenture(venture.id),
    aiCallsRepo.sumByVenture(venture.id),
  ]);

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6 sm:p-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; All ventures
        </Link>

        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{venture.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{venture.description}</p>
            </div>
            <Badge tone={stageTone(venture.stage)}>{stageLabel(venture.stage)}</Badge>
          </div>
          <StageTimeline stage={venture.stage} />
        </Card>

        {artifacts.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">
              No analysis yet for this venture.
            </p>
          </Card>
        ) : (
          artifacts.map((artifact) => <ArtifactRenderer key={artifact.id} artifact={artifact} />)
        )}

        <Card className="flex flex-col gap-3">
          <VentureActions ventureId={venture.id} stage={venture.stage} />
          <p className="text-xs text-muted-foreground">
            Spend on this venture: {formatUsd(spend)} &middot; last updated {relativeTime(venture.updatedAt)}
          </p>
        </Card>
      </main>
    </div>
  );
}
