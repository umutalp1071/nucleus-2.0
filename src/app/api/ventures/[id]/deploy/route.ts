import { NextRequest, NextResponse } from "next/server";
import * as ventures from "@/server/db/repositories/ventures";
import { deployLandingPage } from "@/server/ventures/deployLandingPage";

export const runtime = "nodejs";

function statusFor(reason: "missing_prerequisite" | "deploy_failed"): number {
  return reason === "missing_prerequisite" ? 400 : 502;
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const result = await deployLandingPage(venture);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ venture: result.venture, url: result.url, live: result.live });
}
