import { NextRequest, NextResponse } from "next/server";
import * as ventures from "@/server/db/repositories/ventures";
import * as artifactsRepo from "@/server/db/repositories/artifacts";
import { renderLandingPage } from "@/server/launch/template";
import type { Landing } from "@/lib/domain";

export const runtime = "nodejs";

// Rendered fresh from the latest landing_page artifact on every request --
// the user must see the current copy before deploying, never a stale file.
// See docs/plan/PHASE-08-launch-stage.md.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const landingArtifact = await artifactsRepo.latestOfKind(venture.id, "landing_page");
  if (!landingArtifact) {
    return NextResponse.json({ error: "No landing page copy yet. Generate it first." }, { status: 404 });
  }

  const html = renderLandingPage(landingArtifact.content as Landing, venture.title, venture.emailCaptureUrl);
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
