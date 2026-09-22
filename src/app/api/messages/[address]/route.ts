import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

async function resolvePartner(address: string) {
  return prisma.user.findUnique({
    where: { address: address.toLowerCase() },
    select: { id: true, address: true, username: true, avatarUrl: true },
  });
}

// GET → conversation with `address`; also marks their messages to me as read.
export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { address } = await params;
  const me = session.userId;

  const partner = await resolvePartner(address);
  if (!partner) return NextResponse.json({ partner: null, messages: [] });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, recipientId: partner.id },
        { senderId: partner.id, recipientId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, body: true, senderId: true, createdAt: true },
  });

  // Mark their messages to me as read.
  await prisma.message.updateMany({
    where: { senderId: partner.id, recipientId: me, read: false },
    data: { read: true },
  });

  return NextResponse.json({
    partner,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === me,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

// POST { body } → send a message to `address`.
export async function POST(req: Request, { params }: { params: Promise<{ address: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { address } = await params;
  const me = session.userId;

  const rl = await checkRateLimit(`dm:${me}`, 30, "1 m");
  if (!rl.ok) return NextResponse.json({ error: "slow down" }, { status: 429 });

  const partner = await resolvePartner(address);
  if (!partner) return NextResponse.json({ error: "no such user" }, { status: 404 });
  if (partner.id === me) return NextResponse.json({ error: "can't message yourself" }, { status: 400 });

  // Respect blocks in either direction.
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me, blockedId: partner.id },
        { blockerId: partner.id, blockedId: me },
      ],
    },
    select: { id: true },
  });
  if (block) return NextResponse.json({ error: "can't message this user" }, { status: 403 });

  const { body } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const msg = await prisma.message.create({
    data: { senderId: me, recipientId: partner.id, body: text },
    select: { id: true, body: true, createdAt: true },
  });

  return NextResponse.json({
    message: { id: msg.id, body: msg.body, mine: true, createdAt: msg.createdAt.toISOString() },
  });
}
