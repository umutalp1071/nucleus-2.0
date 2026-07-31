import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";
import * as observationsRepo from "@/server/db/repositories/observations";

export const runtime = "nodejs";

// Manual entry only -- see the "ponytail" note in
// docs/plan/PHASE-09-growth-stage.md: typing a number once a week costs
// nothing; an analytics integration is a permanent maintenance surface this
// phase deliberately doesn't take on.
const BodySchema = z.object({
  metric: z.string().min(1).max(80),
  value: z.number().nullable(),
  note: z.string().max(500).nullable(),
  observedAt: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid entry." }, { status: 400 });

  const observation = await observationsRepo.create({ ventureId: venture.id, source: "manual", ...parsed.data });
  return NextResponse.json({ observation });
}
