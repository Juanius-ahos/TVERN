import { NextResponse } from "next/server";
import { getTrendingPools, getActivePools } from "@/lib/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type TickerItem = {
  symbol: string;
  priceUsd: number;
  change24h: number;
  isStock: boolean;
};

// The carousel = biggest movers on Robinhood Chain right now (by 24h price change),
// drawn from trending pools, deduped to one row per asset.
export async function GET() {
  let pools = await getTrendingPools();
  if (pools.length === 0) pools = (await getActivePools()).map((p) => ({ ...p, change24h: 0 } as never));

  const seen = new Set<string>();
  const items: TickerItem[] = [];
  for (const p of pools) {
    if (seen.has(p.baseSymbol) || p.priceUsd <= 0) continue;
    seen.add(p.baseSymbol);
    items.push({
      symbol: p.baseSymbol,
      priceUsd: p.priceUsd,
      change24h: p.change24h ?? 0,
      isStock: p.isStock,
    });
  }
  // Rank by absolute 24h move — the biggest movers lead the carousel.
  items.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
  return NextResponse.json({ items: items.slice(0, 20) });
}
