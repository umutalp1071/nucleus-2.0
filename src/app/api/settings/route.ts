import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as settings from "@/server/db/repositories/settings";
import { dataDirInfo } from "@/server/db/store";
import { resolveApiKey } from "@/server/ai/provider";
import { redactKey } from "@/server/redact";
import { DEFAULT_CAPS, type Caps } from "@/server/ai/budget";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CapsSchema = z
  .object({
    daily: z.number().positive(),
    weekly: z.number().positive(),
    monthly: z.number().positive(),
  })
  .refine((c) => c.daily <= c.weekly && c.weekly <= c.monthly, {
    message: "Caps must satisfy daily <= weekly <= monthly.",
  });

const PatchSchema = z.object({
  apiKey: z.union([z.string().min(1), z.null()]).optional(),
  caps: CapsSchema.optional(),
});

// GET never returns the full key -- only a redacted preview. See
// docs/plan/PHASE-05-budget-console.md.
export async function GET() {
  const [apiKey, caps, info] = await Promise.all([
    resolveApiKey(),
    settings.get("budgetCaps", DEFAULT_CAPS),
    dataDirInfo(),
  ]);

  return NextResponse.json({
    hasKey: apiKey !== null,
    keyPreview: apiKey ? redactKey(apiKey) : null,
    aiMode: apiKey ? "live" : "mock",
    caps,
    dataDir: info.dir,
    backupCount: info.backupCount,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings update." }, { status: 400 });
  }

  if (parsed.data.apiKey !== undefined) {
    await settings.set("openRouterApiKey", parsed.data.apiKey);
  }
  if (parsed.data.caps) {
    await settings.set("budgetCaps", parsed.data.caps satisfies Caps);
  }

  const [apiKey, caps] = await Promise.all([resolveApiKey(), settings.get("budgetCaps", DEFAULT_CAPS)]);
  return NextResponse.json({
    hasKey: apiKey !== null,
    keyPreview: apiKey ? redactKey(apiKey) : null,
    aiMode: apiKey ? "live" : "mock",
    caps,
  });
}
