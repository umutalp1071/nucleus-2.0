import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as buildTasksRepo from "@/server/db/repositories/buildTasks";

export const runtime = "nodejs";

const BodySchema = z.object({ done: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide done as a boolean." }, { status: 400 });
  }

  try {
    const task = await buildTasksRepo.setDone(params.taskId, parsed.data.done);
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}
