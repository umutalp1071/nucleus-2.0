import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as drafts from "@/server/content/drafts";

export const runtime = "nodejs";

const BodySchema = z.object({ reason: z.string().min(1).max(200) });

export async function POST(request: NextRequest, { params }: { params: { filename: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A one-line reason is required." }, { status: 400 });

  await drafts.rejectDraft(decodeURIComponent(params.filename), parsed.data.reason);
  return NextResponse.json({ ok: true });
}
