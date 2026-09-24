import { NextResponse } from "next/server";
import { pruneOldEvents } from "@/lib/prune";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authed(req: Request): boolean {
  const secret = process.env.INGEST_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  if (!secret && !cronSecret) return true; // no secret set = open in local dev

  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") ?? req.headers.get("x-ingest-secret");
  if (secret && provided === secret) return true;

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer && (bearer === cronSecret || bearer === secret)) return true;

  return false;
}

// GET /api/admin/prune → delete aged tape events beyond the retention window.
export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await pruneOldEvents();
  return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}

export const POST = GET;
