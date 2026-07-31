import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";
import { generatePost } from "@/server/ventures/generatePost";

export const runtime = "nodejs";

const BodySchema = z.object({ day: z.number().min(1).max(28) });

function statusFor(
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite" | "not_found"
): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  if (reason === "missing_prerequisite") return 400;
  if (reason === "not_found") return 404;
  return 502;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await generatePost(venture, parsed.data.day);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ artifact: result.artifact });
}
