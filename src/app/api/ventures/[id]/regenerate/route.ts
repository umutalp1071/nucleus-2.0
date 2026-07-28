import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";
import { regenerateArtifact } from "@/server/ventures/regenerateArtifact";

export const runtime = "nodejs";

const BodySchema = z.object({
  kind: z.enum(["plan", "mvp_scope"]),
  feedback: z.string().min(1),
});

function statusFor(
  reason: "budget_exceeded" | "invalid_output" | "provider_error" | "missing_prerequisite"
): number {
  if (reason === "budget_exceeded") return 429;
  if (reason === "invalid_output") return 422;
  if (reason === "missing_prerequisite") return 400;
  return 502;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a kind and feedback." }, { status: 400 });
  }

  const result = await regenerateArtifact(venture, parsed.data.kind, parsed.data.feedback);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, reason: result.reason }, { status: statusFor(result.reason) });
  }
  return NextResponse.json({ artifact: result.artifact });
}
