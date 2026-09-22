import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const rl = await checkRateLimit(`post:${session.userId}`, 10, "1 m");
  if (!rl.ok) return NextResponse.json({ error: "you're posting too fast" }, { status: 429 });

  const { body, parentId, eventId, mediaUrl, mediaType } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim();

  if (!text && !eventId && !mediaUrl) {
    return NextResponse.json({ error: "empty post" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "too long (max 500)" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.userId,
      body: text,
      mediaUrl: mediaUrl ? String(mediaUrl) : null,
      mediaType: mediaType === "video" ? "video" : mediaUrl ? "image" : null,
      parentId: parentId ?? null,
      eventId: eventId ?? null,
    },
    include: { author: { select: { address: true, username: true, avatarUrl: true } } },
  });

  // Notify the parent author when this is a reply.
  if (post.parentId) {
    const parent = await prisma.post.findUnique({ where: { id: post.parentId }, select: { authorId: true } });
    if (parent) await notify({ userId: parent.authorId, actorId: session.userId, type: "REPLY", postId: post.id });
  }

  return NextResponse.json({ post });
}
