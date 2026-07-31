import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as drafts from "@/server/content/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ paths: z.array(z.string()).max(3) });

export async function GET() {
  const [sources, selected] = await Promise.all([drafts.listVoiceSources(), drafts.getVoiceSamples()]);
  return NextResponse.json({ sources, selected });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide at most 3 paths." }, { status: 400 });

  await drafts.setVoiceSamples(parsed.data.paths);
  return NextResponse.json({ ok: true });
}
