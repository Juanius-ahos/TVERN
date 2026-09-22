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

  const { body, parentId, eventId, mediaUrl, mediaType, poll, communityId } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim();

  // If posting to a community, the author must be a member.
  let communityIdToUse: string | null = null;
  if (communityId && !parentId) {
    const member = await prisma.membership.findUnique({
      where: { communityId_userId: { communityId: String(communityId), userId: session.userId } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ error: "join the community to post" }, { status: 403 });
    communityIdToUse = String(communityId);
  }

  // Validate an optional poll: 2–4 non-empty options, replies can't be polls.
  let pollOptions: string[] = [];
  if (poll && Array.isArray(poll.options) && !parentId) {
    pollOptions = poll.options
      .map((o: unknown) => String(o ?? "").trim().slice(0, 60))
      .filter((o: string) => o.length > 0)
      .slice(0, 4);
    if (pollOptions.length < 2) pollOptions = [];
  }

  if (!text && !eventId && !mediaUrl && pollOptions.length === 0) {
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
      communityId: communityIdToUse,
      ...(pollOptions.length >= 2
        ? { poll: { create: { options: { create: pollOptions.map((t, i) => ({ text: t, idx: i })) } } } }
        : {}),
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
