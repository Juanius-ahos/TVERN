import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { KNOWN_TICKERS } from "@/lib/registry";
import { cached } from "@/lib/redis";

export const dynamic = "force-dynamic";

async function buildFeed(myId: string | undefined, filter: string | null) {
  const where =
    filter === "whale"
      ? { kind: "WHALE" }
      : filter === "stock"
      ? { assetSymbol: { in: [...KNOWN_TICKERS] } }
      : {};

  const [events, posts] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { blockTs: "desc" },
      take: 40,
      include: { _count: { select: { posts: true } } },
    }),
    filter
      ? Promise.resolve([] as never[])
      : prisma.post.findMany({
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          take: 40,
          include: {
            author: { select: { address: true, username: true, avatarUrl: true } },
            event: { select: { id: true, title: true, assetSymbol: true, kind: true } },
            _count: { select: { likes: true, reposts: true, replies: true } },
            likes: myId ? { where: { userId: myId }, select: { id: true } } : false,
            reposts: myId ? { where: { userId: myId }, select: { id: true } } : false,
          },
        }),
  ]);

  const eventItems = events.map((e) => ({
    type: "event" as const,
    id: e.id,
    kind: e.kind,
    title: e.title,
    assetSymbol: e.assetSymbol,
    assetAddress: e.assetAddress,
    fromAddr: e.fromAddr,
    toAddr: e.toAddr,
    usdValue: e.usdValue,
    txHash: e.txHash,
    createdAt: e.blockTs,
    commentCount: e._count.posts,
  }));

  const postItems = posts.map((p) => ({
    type: "post" as const,
    id: p.id,
    body: p.body,
    mediaUrl: p.mediaUrl,
    mediaType: p.mediaType,
    author: p.author,
    event: p.event,
    createdAt: p.createdAt,
    likeCount: p._count.likes,
    repostCount: p._count.reposts,
    replyCount: p._count.replies,
    likedByMe: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    repostedByMe: Array.isArray(p.reposts) ? p.reposts.length > 0 : false,
  }));

  return [...eventItems, ...postItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function GET(req: Request) {
  const session = await readSession();
  const filter = new URL(req.url).searchParams.get("filter");

  // Anonymous traffic (most of a launch-day spike) is served from an 8s cache.
  const items = session
    ? await buildFeed(session.userId, filter)
    : await cached(`feed:${filter ?? "all"}`, 8, () => buildFeed(undefined, filter));

  return NextResponse.json({ items });
}
