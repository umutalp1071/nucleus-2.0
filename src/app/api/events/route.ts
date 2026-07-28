import { NextRequest, NextResponse } from "next/server";
import * as events from "@/server/db/repositories/events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 20, 1), 200) : 20;
  const rows = await events.list(limit);
  return NextResponse.json(rows);
}
