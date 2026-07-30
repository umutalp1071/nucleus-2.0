import { NextRequest, NextResponse } from "next/server";
import * as ventures from "@/server/db/repositories/ventures";
import { generateLandingPage } from "@/server/ventures/generateLandingPage";

export const runtime = "nodejs";

function statusFor(
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"
): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  if (reason === "missing_prerequisite") return 400;
  return 502;
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const result = await generateLandingPage(venture);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ artifact: result.artifact });
}
