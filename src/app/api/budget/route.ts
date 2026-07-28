import { NextResponse } from "next/server";
import { getSpend, DEFAULT_CAPS } from "@/server/ai/budget";
import * as settings from "@/server/db/repositories/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // see /api/health -- GET-only routes get statically optimized otherwise

export async function GET() {
  const [spend, caps] = await Promise.all([getSpend(), settings.get("budgetCaps", DEFAULT_CAPS)]);
  return NextResponse.json({ spend, caps });
}
