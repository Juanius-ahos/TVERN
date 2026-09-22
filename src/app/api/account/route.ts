import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession, clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE the signed-in user's account and all their content (cascades), then clears the session.
export async function DELETE() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  await prisma.user.delete({ where: { id: session.userId } }).catch(() => {});
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
