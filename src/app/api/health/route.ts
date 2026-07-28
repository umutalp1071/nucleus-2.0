import { NextResponse } from "next/server";
import { hasAiKeyConfigured } from "@/server/ai/provider";
import { getSpend, DEFAULT_CAPS } from "@/server/ai/budget";
import * as settings from "@/server/db/repositories/settings";
import * as ventures from "@/server/db/repositories/ventures";

export const runtime = "nodejs";
// GET-only with no dynamic Request API usage would otherwise get statically
// optimized by Next.js — baking build-time spend/ventureCount into a
// permanently cached response. Health data must be evaluated per request.
export const dynamic = "force-dynamic";

export async function GET() {
  const [spend, caps, ventureCount, hasKey] = await Promise.all([
    getSpend(),
    settings.get("budgetCaps", DEFAULT_CAPS),
    ventures.list().then((rows) => rows.length),
    hasAiKeyConfigured(),
  ]);

  return NextResponse.json({
    ok: true,
    aiMode: hasKey ? "live" : "mock",
    deployMode: "mock", // Phase 08 adds the real Vercel adapter
    spend,
    caps,
    ventureCount,
  });
}
