import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as ventures from "@/server/db/repositories/ventures";

export const runtime = "nodejs";

const CreateVentureSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
});

export async function GET() {
  const rows = await ventures.list();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateVentureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid venture data." }, { status: 400 });
  }
  const venture = await ventures.create(parsed.data);
  return NextResponse.json(venture, { status: 201 });
}
