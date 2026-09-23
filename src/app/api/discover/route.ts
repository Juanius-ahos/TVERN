import { NextResponse } from "next/server";
import { getNewPools, getTrendingPools, type DiscoverPool } from "@/lib/registry";

export const dynamic = "force-dynamic";

function trim(p: DiscoverPool) {
  return {
    symbol: p.baseSymbol,
    quote: p.quoteSymbol,
    priceUsd: p.priceUsd,
    volume24: p.volume24,
    liquidityUsd: p.liquidityUsd,
    change1h: p.change1h,
    change24h: p.change24h,
    createdAt: p.createdAt,
    isStock: p.isStock,
  };
}

// GET → { trending, launches } — live from GeckoTerminal (registry caches ~60s).
export async function GET() {
  const [trend, fresh] = await Promise.all([getTrendingPools(), getNewPools()]);
  const data = {
    trending: trend.slice(0, 10).map(trim),
    // new_pools comes newest-first; keep the freshest that aren't dead-on-arrival.
    launches: fresh
      .filter((p) => p.liquidityUsd >= 300 || p.volume24 >= 50)
      .slice(0, 10)
      .map(trim),
  };
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
