import { NextResponse } from "next/server";
import { recoverMessageAddress } from "viem";
import { prisma } from "@/lib/db";
import {
  issueSession,
  setSessionCookie,
  readNonceCookie,
  clearNonceCookie,
} from "@/lib/auth";
import { extractNonce, extractAddress } from "@/lib/siwe";

export async function POST(req: Request) {
  const { message, signature } = await req.json().catch(() => ({}));
  if (!message || !signature) {
    return NextResponse.json({ error: "missing message/signature" }, { status: 400 });
  }

  const address = extractAddress(message);
  const nonce = extractNonce(message);
  const cookieNonce = await readNonceCookie();

  if (!address || !nonce || !cookieNonce || nonce !== cookieNonce) {
    return NextResponse.json({ error: "bad or expired nonce" }, { status: 401 });
  }

  // Verify locally via ECDSA recovery (works for EOAs like MetaMask; no RPC needed).
  let valid = false;
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    valid = recovered.toLowerCase() === address.toLowerCase();
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { address },
    create: { address },
    update: {},
  });

  const token = await issueSession({ userId: user.id, address });
  await setSessionCookie(token);
  await clearNonceCookie();

  return NextResponse.json({
    user: { id: user.id, address: user.address, username: user.username },
  });
}
