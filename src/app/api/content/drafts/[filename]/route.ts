import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as drafts from "@/server/content/drafts";

export const runtime = "nodejs";

const BodySchema = z.object({ content: z.string().min(1) });

export async function PATCH(request: NextRequest, { params }: { params: { filename: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide content as a non-empty string." }, { status: 400 });

  await drafts.editDraft(decodeURIComponent(params.filename), parsed.data.content);
  return NextResponse.json({ ok: true });
}
