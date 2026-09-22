import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { AssetChart } from "@/components/AssetChart";
import { ProfileTabs } from "@/components/ProfileTabs";
import { ReloadComposer } from "@/components/ReloadComposer";
import { WatchButton } from "@/components/WatchButton";
import type { FeedPost } from "@/components/PostCard";
import type { FeedEvent } from "@/components/EventCard";
import { isStockTicker } from "@/lib/assets";
import { postInclude, mapPost } from "@/lib/feedPost";

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const session = await readSession();
  const isStock = isStockTicker(symbol);

  const watching = session
    ? !!(await prisma.watch.findUnique({
        where: { userId_symbol: { userId: session.userId, symbol } },
        select: { id: true },
      }))
    : false;

  const [rawEvents, rawPosts] = await Promise.all([
    prisma.event.findMany({
      where: { assetSymbol: symbol },
      orderBy: { blockTs: "desc" },
      take: 30,
      include: { _count: { select: { posts: true } } },
    }),
    prisma.post.findMany({
      where: { parentId: null, body: { contains: `$${symbol}`, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: postInclude(session?.userId),
    }),
  ]);

  const events: FeedEvent[] = rawEvents.map((e) => ({
    type: "event",
    id: e.id,
    kind: e.kind,
    title: e.title,
    assetSymbol: e.assetSymbol,
    assetAddress: e.assetAddress,
    fromAddr: e.fromAddr,
    toAddr: e.toAddr,
    usdValue: e.usdValue,
    txHash: e.txHash,
    createdAt: e.blockTs.toISOString(),
    commentCount: e._count.posts,
  }));

  const posts: FeedPost[] = rawPosts.map(mapPost);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-[19px] font-bold tracking-tight">
              ${symbol}
              {isStock && (
                <span className="rounded bg-[color:var(--accent)]/15 px-1.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
                  STOCK
                </span>
              )}
            </h1>
            <p className="text-[13px] text-[var(--muted)]">
              {isStock ? "Tokenized stock on Robinhood Chain" : "Token on Robinhood Chain"} · price, activity &amp; discussion
            </p>
          </div>
          <WatchButton symbol={symbol} initialWatching={watching} />
        </div>
      </header>

      <div className="space-y-3 px-4 py-3">
        <AssetChart symbol={symbol} />
        {session && <ReloadComposer initialText={`$${symbol} `} placeholder={`Share your take on $${symbol}…`} />}
      </div>

      <ProfileTabs posts={posts} events={events} canPost={!!session} postsLabel="Discussion" />
    </div>
  );
}
