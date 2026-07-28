import { NextResponse } from "next/server";
import * as aiCallsRepo from "@/server/db/repositories/aiCalls";
import * as venturesRepo from "@/server/db/repositories/ventures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = 30;

export async function GET() {
  const [calls, ventures] = await Promise.all([aiCallsRepo.listAll(), venturesRepo.list()]);
  const titleById = new Map(ventures.map((v) => [v.id, v.title]));

  const byTaskMap = new Map<string, number>();
  const byVentureMap = new Map<string, number>();
  for (const call of calls) {
    byTaskMap.set(call.task, (byTaskMap.get(call.task) ?? 0) + call.costUsd);
    if (call.ventureId) {
      byVentureMap.set(call.ventureId, (byVentureMap.get(call.ventureId) ?? 0) + call.costUsd);
    }
  }

  const byTask = Array.from(byTaskMap.entries())
    .map(([task, costUsd]) => ({ task, costUsd }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const byVenture = Array.from(byVentureMap.entries())
    .map(([ventureId, costUsd]) => ({
      ventureId,
      title: titleById.get(ventureId) ?? "(deleted venture)",
      costUsd,
    }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const dayTotals = new Map<string, number>();
  const now = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayTotals.set(d.toISOString().slice(0, 10), 0);
  }
  for (const call of calls) {
    const day = call.createdAt.slice(0, 10);
    if (dayTotals.has(day)) {
      dayTotals.set(day, (dayTotals.get(day) ?? 0) + call.costUsd);
    }
  }
  const byDay = Array.from(dayTotals.entries()).map(([date, costUsd]) => ({ date, costUsd }));

  return NextResponse.json({ byTask, byVenture, byDay });
}
