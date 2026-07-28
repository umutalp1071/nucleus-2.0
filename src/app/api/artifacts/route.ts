import { NextResponse } from "next/server";
import * as artifacts from "@/server/db/repositories/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Full-fidelity export needs every artifact, not just one venture's -- this
// is the only consumer today (see handleExport in src/app/page.tsx).
export async function GET() {
  const rows = await artifacts.listAll();
  return NextResponse.json(rows);
}
