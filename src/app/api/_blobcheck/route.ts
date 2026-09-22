import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TEMPORARY: verifies Blob upload works via OIDC/connected store. Delete after.
export async function GET() {
  const env = {
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasStoreId: !!process.env.BLOB_STORE_ID,
    hasOidc: !!process.env.VERCEL_OIDC_TOKEN,
  };
  try {
    const blob = await put(`healthcheck/${Date.now()}.txt`, "ok", {
      access: "public",
      contentType: "text/plain",
    });
    return NextResponse.json({ ok: true, url: blob.url, env });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), env }, { status: 500 });
  }
}
