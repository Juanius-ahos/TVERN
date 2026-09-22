import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { KNOWN_TICKERS } from "@/lib/registry";
import { WatchButton } from "@/components/WatchButton";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await readSession();

  if (!session) {
    return (
      <div>
        <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
          <h1 className="text-[19px] font-bold tracking-tight">Watchlist</h1>
        </header>
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          <a href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </a>{" "}
          to build a watchlist of the assets you care about.
        </div>
      </div>
    );
  }

  const watches = await prisma.watch.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { symbol: true },
  });
  const symbols = watches.map((w) => w.symbol);

  // Per-symbol activity: on-chain events + post mentions.
  const [eventCounts, postCounts] = await Promise.all([
    symbols.length
      ? prisma.event.groupBy({
          by: ["assetSymbol"],
          where: { assetSymbol: { in: symbols } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    Promise.all(
      symbols.map((s) =>
        prisma.post
          .count({ where: { parentId: null, body: { contains: `$${s}`, mode: "insensitive" } } })
          .then((n) => [s, n] as const)
      )
    ),
  ]);
  const events = new Map(eventCounts.map((e) => [e.assetSymbol.toUpperCase(), e._count._all]));
  const posts = new Map(postCounts);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Watchlist</h1>
        <p className="text-[13px] text-[var(--muted)]">Assets you follow on Robinhood Chain</p>
      </header>

      {symbols.length === 0 ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          No assets yet. Open any <span className="font-semibold text-[var(--accent)]">$ticker</span> and tap{" "}
          <span className="font-semibold">Watch</span> to add it here.
        </div>
      ) : (
        <div className="grid gap-2 px-4 py-4 sm:grid-cols-2">
          {symbols.map((s) => (
            <div key={s} className="card-hover flex items-center gap-3 rounded-2xl border hairline p-3">
              <a
                href={`/asset/${s}`}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--accent)]/12 text-[16px] font-bold text-[var(--accent)]"
              >
                $
              </a>
              <a href={`/asset/${s}`} className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-bold">
                  ${s}
                  {KNOWN_TICKERS.has(s) && (
                    <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-bold text-[var(--accent)]">
                      STOCK
                    </span>
                  )}
                </span>
                <span className="text-[12px] text-[var(--muted)]">
                  {events.get(s) ?? 0} events · {posts.get(s) ?? 0} posts
                </span>
              </a>
              <WatchButton symbol={s} initialWatching />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
