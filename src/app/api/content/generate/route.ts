import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateBuildInPublicPost } from "@/server/content/generateBuildInPublicPost";

export const runtime = "nodejs";

const BodySchema = z.union([
  z.object({ mode: z.literal("venture"), ventureId: z.string().min(1) }),
  z.object({ mode: z.literal("self") }),
]);

function statusFor(
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "no_story" | "not_found"
): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  if (reason === "not_found") return 404;
  if (reason === "no_story") return 400;
  return 502;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await generateBuildInPublicPost(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ filename: result.filename, post: result.post });
}
