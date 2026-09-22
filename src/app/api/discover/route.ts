import { NextResponse } from "next/server";
import { getNewPools, getTrendingPools, type DiscoverPool } from "@/lib/registry";
import { cached } from "@/lib/redis";

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

// GET → { trending, launches } — live from GeckoTerminal, cached ~60s.
export async function GET() {
  const data = await cached("discover:v1", 60, async () => {
    const [trend, fresh] = await Promise.all([getTrendingPools(), getNewPools()]);
    return {
      trending: trend.slice(0, 10).map(trim),
      launches: fresh
        .filter((p) => p.liquidityUsd >= 1000)
        .slice(0, 10)
        .map(trim),
    };
  });
  return NextResponse.json(data);
}
