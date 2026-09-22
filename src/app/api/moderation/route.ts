import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET → { blocked: string[], muted: string[] } (target user ids)
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ blocked: [], muted: [] });
  const [blocks, mutes] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: session.userId }, select: { blockedId: true } }),
    prisma.mute.findMany({ where: { muterId: session.userId }, select: { mutedId: true } }),
  ]);
  return NextResponse.json({
    blocked: blocks.map((b) => b.blockedId),
    muted: mutes.map((m) => m.mutedId),
  });
}

// POST { targetUserId, action: "block" | "mute" } → toggles, returns new state
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { targetUserId, targetAddress, action } = await req.json().catch(() => ({}));
  let target = String(targetUserId ?? "");
  if (!target && targetAddress) {
    const u = await prisma.user.findUnique({
      where: { address: String(targetAddress).toLowerCase() },
      select: { id: true },
    });
    target = u?.id ?? "";
  }
  if (!target || target === session.userId) {
    return NextResponse.json({ error: "invalid target" }, { status: 400 });
  }

  if (action === "mute") {
    const existing = await prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId: session.userId, mutedId: target } },
    });
    if (existing) {
      await prisma.mute.delete({ where: { id: existing.id } });
      return NextResponse.json({ muted: false });
    }
    await prisma.mute.create({ data: { muterId: session.userId, mutedId: target } });
    return NextResponse.json({ muted: true });
  }

  if (action === "block") {
    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: session.userId, blockedId: target } },
    });
    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return NextResponse.json({ blocked: false });
    }
    // Blocking severs any follow relationship between the two users.
    await prisma.$transaction([
      prisma.block.create({ data: { blockerId: session.userId, blockedId: target } }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: session.userId, followingId: target },
            { followerId: target, followingId: session.userId },
          ],
        },
      }),
    ]);
    return NextResponse.json({ blocked: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
