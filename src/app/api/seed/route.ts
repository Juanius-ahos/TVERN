import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDemoEvents } from "@/lib/ingest";

export const dynamic = "force-dynamic";

// Dev helper. `?reset=1` wipes events first (handy while tuning ingest).
// `?demo=1` also inserts sample events. Disabled in production.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const url = new URL(req.url);
  let deleted = 0;
  if (url.searchParams.get("reset") === "1") {
    const r = await prisma.event.deleteMany({});
    deleted = r.count;
  }
  let created = 0;
  if (url.searchParams.get("demo") === "1") {
    created = await seedDemoEvents();
  }
  return NextResponse.json({ ok: true, deleted, created });
}
