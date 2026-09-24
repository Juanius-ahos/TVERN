import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { maybeAutoIngest } from "@/lib/ingest";
import { maybeAutoIndex } from "@/lib/indexer";
import { maybePonsIndex } from "@/lib/pons";
import { KNOWN_TICKERS } from "@/lib/registry";
import { cached } from "@/lib/redis";
import { getHiddenAuthorIds } from "@/lib/moderation";
import { postInclude, mapPost } from "@/lib/feedPost";

export const dynamic = "force-dynamic";

async function buildFeed(myId: string | undefined, filter: string | null) {
  const hidden = myId ? await getHiddenAuthorIds(myId) : [];
  const where =
    filter === "whale"
      ? { kind: "WHALE" }
      : filter === "launch"
      ? { kind: "LAUNCH" }
      : filter === "stock"
      ? { assetSymbol: { in: [...KNOWN_TICKERS] } }
      : {};

  // "Latest" (no filter) is the social feed: people's posts only.
  // The on-chain tabs (launch/whale/stock) show events only.
  const [events, posts] = await Promise.all([
    filter
      ? prisma.event.findMany({
          where,
          orderBy: { blockTs: "desc" },
          take: 40,
          include: { _count: { select: { posts: true } } },
        })
      : Promise.resolve([] as never[]),
    filter
      ? Promise.resolve([] as never[])
      : prisma.post.findMany({
          where: { parentId: null, ...(hidden.length ? { authorId: { notIn: hidden } } : {}) },
          orderBy: { createdAt: "desc" },
          take: 40,
          include: postInclude(myId),
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
    imageUrl: e.imageUrl,
    progressPct: e.progressPct,
  }));

  const postItems = posts.map(mapPost);

  return [...eventItems, ...postItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function GET(req: Request) {
  const session = await readSession();
  const filter = new URL(req.url).searchParams.get("filter");

  // Keep the feed fresh off live traffic: after responding, one visitor per
  // interval refreshes on-chain events (self-throttled; no cron/secret needed).
  after(async () => {
    await Promise.allSettled([maybeAutoIndex(), maybeAutoIngest(), maybePonsIndex()]);
  });

  // Anonymous traffic (most of a launch-day spike) is served from an 8s cache.
  const items = session
    ? await buildFeed(session.userId, filter)
    : await cached(`feed:${filter ?? "all"}`, 8, () => buildFeed(undefined, filter));

  return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
}
