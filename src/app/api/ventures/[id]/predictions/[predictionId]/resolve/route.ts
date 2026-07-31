import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";
import { resolvePrediction } from "@/server/ventures/resolvePrediction";

export const runtime = "nodejs";

const BodySchema = z.object({ observationId: z.string().min(1) });

function statusFor(reason: "not_found" | "metric_mismatch"): number {
  return reason === "not_found" ? 404 : 400;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; predictionId: string } }
) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await resolvePrediction(params.predictionId, parsed.data.observationId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ prediction: result.prediction });
}
