import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Toggle following either a registered user ({ userId }) or a raw wallet ({ address }).
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { userId, address } = await req.json().catch(() => ({}));

  if (address) {
    const addr = String(address).toLowerCase();
    const existing = await prisma.walletFollow.findUnique({
      where: { userId_address: { userId: session.userId, address: addr } },
    });
    if (existing) await prisma.walletFollow.delete({ where: { id: existing.id } });
    else await prisma.walletFollow.create({ data: { userId: session.userId, address: addr } });
    return NextResponse.json({ following: !existing, kind: "wallet" });
  }

  if (userId && userId !== session.userId) {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.userId, followingId: userId } },
    });
    if (existing) await prisma.follow.delete({ where: { id: existing.id } });
    else await prisma.follow.create({ data: { followerId: session.userId, followingId: userId } });
    return NextResponse.json({ following: !existing, kind: "user" });
  }

  return NextResponse.json({ error: "nothing to follow" }, { status: 400 });
}
