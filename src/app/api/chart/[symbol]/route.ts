import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePool } from "@/lib/registry";
import { liveCached } from "@/lib/redis";

export const dynamic = "force-dynamic";

const GT = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  // Resolve the token's top pool live (works for any token), else fall back to an indexed event.
  let poolAddr: string | null = null;
  const resolved = await resolvePool(sym);
  if (resolved?.poolAddress) {
    poolAddr = resolved.poolAddress;
  } else {
    const ev = await prisma.event.findFirst({
      where: { assetSymbol: sym, assetAddress: { not: "" } },
      select: { assetAddress: true },
    });
    if (ev?.assetAddress) {
      try {
        const pr = await fetch(`${GT}/networks/${NETWORK}/tokens/${ev.assetAddress}/pools`, {
          headers: { accept: "application/json" },
        });
        const pd = await pr.json();
        poolAddr = pd.data?.[0]?.attributes?.address ?? null;
      } catch {
        /* ignore */
      }
    }
  }

  if (!poolAddr) return NextResponse.json({ points: [], pool: null });

  try {
    // Cached with last-known-good so a transient GT hiccup never blanks the chart.
    const points = await liveCached(
      `gt:ohlcv:${poolAddr}`,
      60,
      async () => {
        const or = await fetch(
          `${GT}/networks/${NETWORK}/pools/${poolAddr}/ohlcv/hour?aggregate=1&limit=72&currency=usd`,
          { headers: { accept: "application/json" } }
        );
        if (!or.ok) throw new Error(`gt ${or.status}`);
        const od = await or.json();
        const list: number[][] = od.data?.attributes?.ohlcv_list ?? [];
        // ohlcv_list = [timestamp, open, high, low, close, volume], newest first
        return list
          .map((r) => ({ t: r[0], c: r[4] }))
          .filter((p) => isFinite(p.c))
          .reverse();
      },
      (p) => p.length === 0
    );

    const last = points.at(-1)?.c ?? resolved?.priceUsd ?? null;
    const dayAgo = points.length > 24 ? points[points.length - 25].c : points[0]?.c;
    const change24 =
      last && dayAgo ? ((last - dayAgo) / dayAgo) * 100 : resolved?.change24h ?? null;

    return NextResponse.json(
      { points, pool: poolAddr, last, change24 },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ points: [], pool: poolAddr }, { headers: { "cache-control": "no-store" } });
  }
}
