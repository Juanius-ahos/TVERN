import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { readSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const OK = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const rl = await checkRateLimit(`upload:${session.userId}`, 20, "1 m");
  if (!rl.ok) return NextResponse.json({ error: "slow down" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!OK.has(file.type)) return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large (max 15MB)" }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const type = file.type.startsWith("video/") ? "video" : "image";

  // Production: Vercel Blob (persistent, CDN-served). Works with either a static
  // BLOB_READ_WRITE_TOKEN or, on Vercel, OIDC auth from a connected store (BLOB_STORE_ID).
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    try {
      const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type });
      return NextResponse.json({ url: blob.url, type });
    } catch (e) {
      console.error("blob upload failed", e);
      return NextResponse.json({ error: "upload failed" }, { status: 500 });
    }
  }

  // On Vercel without Blob configured yet: fail cleanly (fs is read-only there).
  if (process.env.VERCEL) {
    return NextResponse.json({ error: "media uploads coming soon" }, { status: 501 });
  }

  // Local dev fallback.
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}`, type });
}
