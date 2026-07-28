import { NextResponse } from "next/server";
import { writeCollection } from "@/server/db/store";

export const runtime = "nodejs";

// A full factory reset -- every collection, including settings (the stored
// API key and caps). Gated behind a typed confirmation in the UI.
const ALL_COLLECTIONS = ["ventures", "artifacts", "events", "ai-calls", "settings", "ai-cache"];

export async function POST() {
  await Promise.all(ALL_COLLECTIONS.map((name) => writeCollection(name, [])));
  return NextResponse.json({ ok: true });
}
