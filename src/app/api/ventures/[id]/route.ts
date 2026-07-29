import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";

export const runtime = "nodejs";

// Title/description only — stage is never writable from the client. Stage
// changes only ever happen through advance(), which enforces the transition
// table. See docs/plan/ARCHITECTURE.md.
const PatchVentureSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  buildUrl: z.string().max(500).nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const venture = await ventures.get(params.id);
  if (!venture) return NextResponse.json({ error: "Venture not found." }, { status: 404 });
  return NextResponse.json(venture);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = PatchVentureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  try {
    const updated = await ventures.update(params.id, parsed.data);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Venture not found." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const archived = await ventures.remove(params.id);
    return NextResponse.json(archived);
  } catch {
    return NextResponse.json({ error: "Venture not found." }, { status: 404 });
  }
}
