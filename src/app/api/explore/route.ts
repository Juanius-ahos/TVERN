import { NextResponse } from "next/server";
import { getActivePools, getNewPools, getTrendingPools, type DiscoverPool } from "@/lib/registry";

export const dynamic = "force-dynamic";

function trim(p: DiscoverPool) {
  return {
    symbol: p.baseSymbol,
    quote: p.quoteSymbol,
    priceUsd: p.priceUsd,
    volume24: p.volume24,
    liquidityUsd: p.liquidityUsd,
    change24h: p.change24h,
    createdAt: p.createdAt,
    isStock: p.isStock,
  };
}

// GET → live market discovery: top gainers, most-traded, biggest losers, fresh launches.
export async function GET() {
  const [trending, active, fresh] = await Promise.all([
    getTrendingPools(),
    getActivePools(),
    getNewPools(),
  ]);

  // Dedupe a symbol list to one row each.
  const uniq = (rows: DiscoverPool[]) => {
    const seen = new Set<string>();
    const out: DiscoverPool[] = [];
    for (const p of rows) {
      if (seen.has(p.baseSymbol) || p.priceUsd <= 0) continue;
      seen.add(p.baseSymbol);
      out.push(p);
    }
    return out;
  };

  const movers = uniq(trending);
  const gainers = [...movers].sort((a, b) => b.change24h - a.change24h).filter((p) => p.change24h > 0).slice(0, 8);
  const losers = [...movers].sort((a, b) => a.change24h - b.change24h).filter((p) => p.change24h < 0).slice(0, 8);
  const launches = fresh.filter((p) => p.liquidityUsd >= 300 || p.volume24 >= 50).slice(0, 8);

  // active pools are already sorted by 24h volume desc.
  const seenT = new Set<string>();
  const mostTraded = active
    .filter((p) => p.priceUsd > 0 && !seenT.has(p.baseSymbol) && (seenT.add(p.baseSymbol), true))
    .slice(0, 8)
    .map((p) => ({
      symbol: p.baseSymbol,
      quote: p.quoteSymbol,
      priceUsd: p.priceUsd,
      volume24: p.volume24,
      liquidityUsd: 0,
      change24h: 0,
      createdAt: null as string | null,
      isStock: p.isStock,
    }));

  return NextResponse.json({
    gainers: gainers.map(trim),
    losers: losers.map(trim),
    mostTraded,
    launches: launches.map(trim),
  });
}
