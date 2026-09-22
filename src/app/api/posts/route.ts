import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

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

  return NextResponse.json({ post });
}
