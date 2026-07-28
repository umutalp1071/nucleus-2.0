import { NextResponse } from "next/server";
import { clearCache } from "@/server/ai/cache";

export const runtime = "nodejs";

export async function POST() {
  await clearCache();
  return NextResponse.json({ ok: true });
}
