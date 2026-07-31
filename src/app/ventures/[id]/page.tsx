import { notFound } from "next/navigation";
import Link from "next/link";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifactsRepo from "@/server/db/repositories/artifacts";
import * as aiCallsRepo from "@/server/db/repositories/aiCalls";
import * as buildTasksRepo from "@/server/db/repositories/buildTasks";
import * as decisionsRepo from "@/server/db/repositories/decisions";
import * as predictionsRepo from "@/server/db/repositories/predictions";
import * as observationsRepo from "@/server/db/repositories/observations";
import { Card, Badge } from "@/components/dashboard/ui";
import { StageTimeline } from "@/components/venture/StageTimeline";
import { VentureActions } from "@/components/venture/VentureActions";
import { BuildStagePanel } from "@/components/venture/BuildStagePanel";
import { LaunchPanel } from "@/components/venture/LaunchPanel";
import { GrowthPanel } from "@/components/venture/GrowthPanel";
import { ArtifactRenderer } from "@/components/venture/artifacts";
import { stageLabel, stageTone } from "@/lib/stages";
import { formatUsd, relativeTime } from "@/lib/format";
import type { Artifact, ArtifactKind, MvpScope, Plan, Calendar, WeeklyReview } from "@/lib/domain";

export const dynamic = "force-dynamic";

// Fixed display order, not recency order -- otherwise a just-regenerated
// mvp_scope could jump above its own prerequisite validation artifact.
const KIND_ORDER: ArtifactKind[] = [
  "validation",
  "competitors",
  "plan",
  "mvp_scope",
  "landing_page",
  "content_calendar",
  "build_spec",
];

function groupByKind(artifacts: Artifact[]): Array<{ kind: ArtifactKind; latest: Artifact; older: Artifact[] }> {
  const byKind = new Map<ArtifactKind, Artifact[]>();
  for (const a of artifacts) {
    const list = byKind.get(a.kind) ?? [];
    list.push(a); // already newest-first from the repository
    byKind.set(a.kind, list);
  }
  return KIND_ORDER.filter((k) => byKind.has(k)).map((kind) => {
    const [latest, ...older] = byKind.get(kind)!;
    return { kind, latest, older };
  });
}

export default async function VentureWorkspace({ params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) notFound();

  const [artifacts, spend, buildTasks, decisions, predictions, observations] = await Promise.all([
    artifactsRepo.listByVenture(venture.id),
    aiCallsRepo.sumByVenture(venture.id),
    buildTasksRepo.listByVenture(venture.id),
    decisionsRepo.listByVenture(venture.id),
    predictionsRepo.listByVenture(venture.id),
    observationsRepo.listByVenture(venture.id),
  ]);
  const decisionByArtifactId = new Map(decisions.map((d) => [d.artifactId, d]));
  const groups = groupByKind(artifacts);
  const mvpScopeGroup = groups.find((g) => g.kind === "mvp_scope");
  const stack = mvpScopeGroup ? (mvpScopeGroup.latest.content as MvpScope).stack : undefined;
  const buildSpecContext = { ventureTitle: venture.title, stack };
  const planGroup = groups.find((g) => g.kind === "plan");
  const firstTenUsers = planGroup ? (planGroup.latest.content as Plan).firstTenUsers : null;
  const killCriteria = planGroup ? (planGroup.latest.content as Plan).killCriteria : null;

  const calendarGroup = groups.find((g) => g.kind === "content_calendar");
  const calendar = calendarGroup ? (calendarGroup.latest.content as Calendar) : null;
  const seenDays = new Set<number>();
  const posts = artifacts
    .filter((a) => a.kind === "content_post") // already newest-first
    .map((a) => a.content as Calendar["posts"][number] & { draft: string })
    .filter((p) => (seenDays.has(p.day) ? false : (seenDays.add(p.day), true)));
  const weeklyReviewArtifact = artifacts.find((a) => a.kind === "weekly_review");
  const weeklyReview = weeklyReviewArtifact ? (weeklyReviewArtifact.content as WeeklyReview) : null;

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

        {groups.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">No analysis yet for this venture.</p>
          </Card>
        ) : (
          groups.map(({ kind, latest, older }) => (
            <Card key={kind} className="flex flex-col gap-3">
              <ArtifactRenderer
                artifact={latest}
                buildSpecContext={buildSpecContext}
                decision={decisionByArtifactId.get(latest.id)}
              />
              {older.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    {older.length} earlier version{older.length === 1 ? "" : "s"}
                  </summary>
                  <div className="mt-2 flex flex-col gap-3 border-t border-border pt-2">
                    {older.map((artifact) => (
                      <div key={artifact.id} className="opacity-70">
                        <p className="mb-1">{relativeTime(artifact.createdAt)}</p>
                        <ArtifactRenderer
                          artifact={artifact}
                          buildSpecContext={buildSpecContext}
                          decision={decisionByArtifactId.get(artifact.id)}
                        />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          ))
        )}

        <BuildStagePanel
          ventureId={venture.id}
          stage={venture.stage}
          tasks={buildTasks}
          buildUrl={venture.buildUrl ?? null}
          hasBuildSpec={groups.some((g) => g.kind === "build_spec")}
        />

        <LaunchPanel
          ventureId={venture.id}
          stage={venture.stage}
          hasLandingPage={groups.some((g) => g.kind === "landing_page")}
          emailCaptureUrl={venture.emailCaptureUrl ?? null}
          launchUrl={venture.launchUrl ?? null}
          firstTenUsers={firstTenUsers}
        />

        <GrowthPanel
          ventureId={venture.id}
          stage={venture.stage}
          calendar={calendar}
          posts={posts}
          predictions={predictions}
          observations={observations}
          killCriteria={killCriteria}
          weeklyReview={weeklyReview}
        />

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
