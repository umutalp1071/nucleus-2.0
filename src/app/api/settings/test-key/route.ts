import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { makeOpenRouterProvider } from "@/server/ai/provider";
import { runTask } from "@/server/ai/gateway";

export const runtime = "nodejs";

const BodySchema = z.object({ apiKey: z.string().min(1) });

// Tests a candidate key BEFORE it's saved -- goes through the same runTask()
// chokepoint as every other call, budget guard included. Not a special path.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Provide a key to test." }, { status: 400 });
  }

  const provider = makeOpenRouterProvider(parsed.data.apiKey);
  const result = await runTask("echo-check", { message: "ping" }, { provider });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message });
  }
  return NextResponse.json({ ok: true, message: "Key works." });
}
