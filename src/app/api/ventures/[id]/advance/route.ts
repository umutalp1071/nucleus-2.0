import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";
import * as buildTasksRepo from "@/server/db/repositories/buildTasks";
import { validateAndAdvance } from "@/server/ventures/validateAndAdvance";
import { planAndAdvance } from "@/server/ventures/planAndAdvance";
import { startBuilding } from "@/server/ventures/startBuilding";
import { StageSchema } from "@/lib/domain";

export const runtime = "nodejs";

const BodySchema = z.object({ to: StageSchema.optional(), skipRemaining: z.boolean().optional() });

function statusFor(
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"
): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  if (reason === "missing_prerequisite") return 400;
  return 502;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Plain stage transition, no AI task -- e.g. the user clicking "Kill it"
  // after reading a verdict they already have.
  if (parsed.data.to) {
    // The stage machine's honesty is the point -- a half-built venture is
    // never silently marked launched. See docs/plan/PHASE-07-build-stage.md.
    if (parsed.data.to === "launched" && venture.stage === "building" && !parsed.data.skipRemaining) {
      const tasks = await buildTasksRepo.listByVenture(venture.id);
      const incomplete = tasks.filter((t) => !t.done).length;
      if (incomplete > 0) {
        return NextResponse.json(
          { error: `${incomplete} build task${incomplete === 1 ? "" : "s"} still unchecked.`, reason: "tasks_incomplete" },
          { status: 409 }
        );
      }
    }
    try {
      const updated = await ventures.advance(venture.id, parsed.data.to);
      return NextResponse.json({ venture: updated });
    } catch {
      return NextResponse.json({ error: "That change isn't allowed from the current stage." }, { status: 400 });
    }
  }

  if (venture.stage === "captured") {
    const result = await validateAndAdvance(venture);
    if (!result.ok) {
      return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
    }
    return NextResponse.json({
      venture: result.venture,
      verdict: result.verdict,
      competitors: result.competitors,
      demo: result.demo,
      downgraded: result.downgraded,
    });
  }

  if (venture.stage === "validated") {
    const result = await planAndAdvance(venture);
    if (!result.ok) {
      return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
    }
    return NextResponse.json({
      venture: result.venture,
      plan: result.plan,
      mvpScope: result.mvpScope,
      demo: result.demo,
    });
  }

  if (venture.stage === "planned") {
    const result = await startBuilding(venture);
    if (!result.ok) {
      return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
    }
    return NextResponse.json({ venture: result.venture, tasks: result.tasks });
  }

  return NextResponse.json({ error: "This venture has no automatic next step." }, { status: 400 });
}
