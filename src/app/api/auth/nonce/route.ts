import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { setNonceCookie } from "@/lib/auth";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  await setNonceCookie(nonce);
  return NextResponse.json(
    { nonce },
    { headers: { "cache-control": "no-store" } }
  );
}
