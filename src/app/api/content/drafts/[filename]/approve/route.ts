import { NextRequest, NextResponse } from "next/server";
import * as drafts from "@/server/content/drafts";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    await drafts.approveDraft(decodeURIComponent(params.filename));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't approve that draft." }, { status: 404 });
  }
}
