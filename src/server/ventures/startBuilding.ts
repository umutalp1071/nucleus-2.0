import * as ventures from "../db/repositories/ventures";
import * as artifactsRepo from "../db/repositories/artifacts";
import * as buildTasksRepo from "../db/repositories/buildTasks";
import { recordEvent } from "../events";
import type { Venture, MvpScope, BuildTask } from "@/lib/domain";

export type StartBuildingResult =
  | { ok: true; venture: Venture; tasks: BuildTask[] }
  | { ok: false; reason: "missing_prerequisite"; message: string };

interface Opts {
  baseDir?: string;
}

// planned -> building. Expands each MVP milestone into one checkable task.
// ponytail: no AI call -- the milestones already contain the content this
// needs, so this stays a pure data transformation. See
// docs/plan/PHASE-07-build-stage.md.
export async function startBuilding(venture: Venture, opts?: Opts): Promise<StartBuildingResult> {
  const repoOpts = { baseDir: opts?.baseDir };
  const mvpArtifact = await artifactsRepo.latestOfKind(venture.id, "mvp_scope", repoOpts);
  if (!mvpArtifact) {
    return {
      ok: false,
      reason: "missing_prerequisite",
      message: "Nucleus needs an MVP scope before it can create build tasks.",
    };
  }

  const mvpScope = mvpArtifact.content as MvpScope;
  const tasks = await buildTasksRepo.createMany(
    venture.id,
    mvpScope.milestones.map((m) => ({ milestone: m.name, title: m.outcome })),
    repoOpts
  );

  await recordEvent(
    "venture.building",
    `"${venture.title}" entered build -- ${tasks.length} task${tasks.length === 1 ? "" : "s"} from the MVP scope.`,
    { ventureId: venture.id, baseDir: opts?.baseDir }
  );
  const updated = await ventures.advance(venture.id, "building", repoOpts);

  return { ok: true, venture: updated, tasks };
}
