import { NextResponse } from "next/server";
import * as drafts from "@/server/content/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const list = await drafts.listDrafts();
  return NextResponse.json({ drafts: list });
}
