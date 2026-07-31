import { NextRequest, NextResponse } from "next/server";
import * as ventures from "@/server/db/repositories/ventures";
import { runWeeklyReview } from "@/server/ventures/runWeeklyReview";

export const runtime = "nodejs";

function statusFor(reason: "budget_exceeded" | "invalid_output" | "provider_error"): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  return 502;
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const result = await runWeeklyReview(venture);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ artifact: result.artifact });
}
