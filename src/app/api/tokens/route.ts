import { NextResponse } from "next/server";
import { getPoolUniverse, getDexUniverse, getTrendingPools, getNewPools, type DiscoverPool } from "@/lib/registry";

export const dynamic = "force-dynamic";

function row(p: DiscoverPool) {
  return {
    symbol: p.baseSymbol,
    imageUrl: p.baseImageUrl || null,
    quote: p.quoteSymbol,
    priceUsd: p.priceUsd,
    volume24: p.volume24,
    liquidityUsd: p.liquidityUsd,
    mcap: p.mcap,
    fdv: p.fdv,
    change1h: p.change1h,
    change24h: p.change24h,
    createdAt: p.createdAt,
    isStock: p.isStock,
  };
}

// GET → the full live token screener (deduped, ranked) + market summary.
export async function GET() {
  const [universe, dex, trending, fresh] = await Promise.all([
    getPoolUniverse(10), // full paginated pool list — the real token universe, not just page 1
    getDexUniverse(), // second source (DexScreener) — catches tokens GeckoTerminal misses
    getTrendingPools(),
    getNewPools(),
  ]);

  // Merge everything, keeping the richest record per token symbol.
  const bySymbol = new Map<string, DiscoverPool>();
  const add = (p: DiscoverPool) => {
    if (!p.baseSymbol || p.priceUsd <= 0) return;
    const cur = bySymbol.get(p.baseSymbol);
    if (!cur) {
      bySymbol.set(p.baseSymbol, p);
      return;
    }
    // prefer more volume, and fill in mcap/change from whichever record has them
    const merged: DiscoverPool = { ...cur };
    if (p.volume24 > merged.volume24) merged.volume24 = p.volume24;
    if (merged.mcap === 0 && p.mcap > 0) merged.mcap = p.mcap;
    if (merged.fdv === 0 && p.fdv > 0) merged.fdv = p.fdv;
    if (merged.change24h === 0 && p.change24h !== 0) merged.change24h = p.change24h;
    if (!merged.createdAt && p.createdAt) merged.createdAt = p.createdAt;
    if (merged.liquidityUsd === 0 && p.liquidityUsd > 0) merged.liquidityUsd = p.liquidityUsd;
    bySymbol.set(p.baseSymbol, merged);
  };
  universe.forEach(add);
  dex.forEach(add);
  trending.forEach(add);
  fresh.forEach(add);

  const tokens = [...bySymbol.values()].sort((a, b) => b.volume24 - a.volume24).slice(0, 400).map(row);

  const stats = {
    tokens: tokens.length,
    volume24: tokens.reduce((s, t) => s + t.volume24, 0),
    liquidity: tokens.reduce((s, t) => s + t.liquidityUsd, 0),
  };

  return NextResponse.json({ tokens, stats }, { headers: { "cache-control": "no-store" } });
}
