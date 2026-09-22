import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET → { conversations, unread } — one row per other party, newest first.
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ conversations: [], unread: 0 });
  const me = session.userId;

  const rows = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { recipientId: me }] },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      sender: { select: { id: true, address: true, username: true, avatarUrl: true } },
      recipient: { select: { id: true, address: true, username: true, avatarUrl: true } },
    },
  });

  type Convo = {
    partner: { id: string; address: string; username: string | null; avatarUrl: string | null };
    lastBody: string;
    lastAt: string;
    unread: number;
  };
  const byPartner = new Map<string, Convo>();
  let unreadTotal = 0;

  for (const m of rows) {
    const partner = m.senderId === me ? m.recipient : m.sender;
    const isUnread = m.recipientId === me && !m.read;
    if (isUnread) unreadTotal++;
    const existing = byPartner.get(partner.id);
    if (!existing) {
      byPartner.set(partner.id, {
        partner,
        lastBody: m.body,
        lastAt: m.createdAt.toISOString(),
        unread: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unread++;
    }
  }

  return NextResponse.json({ conversations: [...byPartner.values()], unread: unreadTotal });
}
