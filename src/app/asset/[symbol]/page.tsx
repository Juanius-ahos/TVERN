import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { EventCard, type FeedEvent } from "@/components/EventCard";
import { KNOWN_TICKERS } from "@/lib/registry";

export default async function AssetPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const session = await readSession();

  const events = await prisma.event.findMany({
    where: { assetSymbol: symbol },
    orderBy: { blockTs: "desc" },
    take: 40,
    include: { _count: { select: { posts: true } } },
  });

  const items: FeedEvent[] = events.map((e) => ({
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

  const isStock = KNOWN_TICKERS.has(symbol);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="flex items-center gap-2 text-[19px] font-bold tracking-tight">
          ${symbol}
          {isStock && (
            <span className="rounded bg-[color:var(--accent)]/15 px-1.5 py-0.5 text-xs text-[var(--accent)]">
              STOCK
            </span>
          )}
        </h1>
        <p className="text-[13px] text-[var(--muted)]">Recent on-chain activity for ${symbol}</p>
      </header>

      <div className="space-y-3 px-4 py-3">
        {items.length === 0 && (
          <div className="py-10 text-center text-[var(--muted)]">No indexed activity for ${symbol} yet.</div>
        )}
        {items.map((e) => (
          <EventCard key={e.id} e={e} canPost={!!session} />
        ))}
      </div>
    </div>
  );
}
