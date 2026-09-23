import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { AssetChart } from "@/components/AssetChart";
import { ProfileTabs } from "@/components/ProfileTabs";
import { ReloadComposer } from "@/components/ReloadComposer";
import { WatchButton } from "@/components/WatchButton";
import { LiveTrades } from "@/components/LiveTrades";
import type { FeedPost } from "@/components/PostCard";
import type { FeedEvent } from "@/components/EventCard";
import { isStockTicker } from "@/lib/assets";
import { postInclude, mapPost } from "@/lib/feedPost";
import { getTokenStats } from "@/lib/registry";
import { formatUsd } from "@/lib/format";

function fmtPrice(n: number): string {
  if (!n) return "-";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
}
function fmtBig(n: number): string {
  if (!n) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

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

  const [market, rawEvents, rawPosts] = await Promise.all([
    getTokenStats(symbol),
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
      <header className="glass sticky top-11 z-20 border-b hairline px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-2.5">
              <span className="display text-[26px] font-semibold tracking-tight">${symbol}</span>
              {isStock && (
                <span className="rounded bg-[color:var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-text)]">
                  Stock
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {isStock ? "Tokenized stock" : "Token"} on Robinhood Chain
              {market?.quoteSymbol ? ` · ${symbol}/${market.quoteSymbol}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {market && (
              <div className="text-right">
                <div className="text-[20px] font-bold tabular-nums leading-none">{fmtPrice(market.priceUsd)}</div>
                <div
                  className={`mt-1 text-[13px] font-semibold tabular-nums ${
                    market.change24h > 0 ? "text-[var(--up)]" : market.change24h < 0 ? "text-[var(--down)]" : "text-[var(--muted)]"
                  }`}
                >
                  {market.change24h > 0 ? "+" : ""}
                  {market.change24h.toFixed(2)}% · 24h
                </div>
              </div>
            )}
            <WatchButton symbol={symbol} initialWatching={watching} />
          </div>
        </div>
      </header>

      {market && (
        <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-b hairline sm:grid-cols-4">
          {[
            { label: "Market cap", value: fmtBig(market.mcap) },
            { label: "FDV", value: fmtBig(market.fdv) },
            { label: "24h volume", value: formatUsd(market.volume24) },
            { label: "Liquidity", value: formatUsd(market.liquidityUsd) },
          ].map((s, i) => (
            <div key={s.label} className={`px-5 py-3 ${i >= 2 ? "border-t hairline sm:border-t-0" : ""}`}>
              <div className="text-[11px] uppercase tracking-wide text-[var(--faint)]">{s.label}</div>
              <div className="mt-0.5 text-[15px] font-semibold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <AssetChart symbol={symbol} />
          {session && <ReloadComposer initialText={`$${symbol} `} placeholder={`Share your take on $${symbol}…`} />}
        </div>
        <div className="lg:col-span-2">
          <LiveTrades symbol={symbol} />
        </div>
      </div>

      <ProfileTabs
        posts={posts}
        events={events}
        canPost={!!session}
        postsLabel="Discussion"
        postsEmpty={{ title: `No posts about $${symbol} yet`, sub: "Be the first to share a take." }}
      />
    </div>
  );
}
