import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET → { items, unread }
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ items: [], unread: 0 });

  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: { select: { address: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.notification.count({ where: { userId: session.userId, read: false } }),
  ]);

  const postIds = rows.map((r) => r.postId).filter((x): x is string => !!x);
  const posts = postIds.length
    ? await prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true, body: true },
      })
    : [];
  const bodyById = new Map(posts.map((p) => [p.id, p.body]));

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    read: r.read,
    createdAt: r.createdAt.toISOString(),
    actor: r.actor,
    postId: r.postId,
    postExcerpt: r.postId ? (bodyById.get(r.postId) ?? "").slice(0, 100) : null,
  }));

  return NextResponse.json({ items, unread });
}

// POST → mark all as read
export async function POST() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
