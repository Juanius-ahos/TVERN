import { NextResponse } from "next/server";
import { getActivePools, getTrendingPools, getNewPools, type DiscoverPool } from "@/lib/registry";

export const dynamic = "force-dynamic";

function row(p: DiscoverPool) {
  return {
    symbol: p.baseSymbol,
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
  const [trending, active, fresh] = await Promise.all([
    getTrendingPools(),
    getActivePools(),
    getNewPools(),
  ]);

  // active pools lack change/mcap; trending + new carry the rich fields. Merge,
  // preferring the richest record per symbol.
  const bySymbol = new Map<string, DiscoverPool>();
  const add = (p: DiscoverPool) => {
    if (!p.baseSymbol || p.priceUsd <= 0) return;
    const cur = bySymbol.get(p.baseSymbol);
    if (!cur || p.volume24 > cur.volume24 || (p.mcap > 0 && cur.mcap === 0)) {
      bySymbol.set(p.baseSymbol, { ...cur, ...p });
    }
  };
  trending.forEach(add);
  fresh.forEach(add);
  // active pools only have symbol/price/volume — enrich existing rows' volume.
  for (const a of active) {
    const cur = bySymbol.get(a.baseSymbol);
    if (cur) {
      if (a.volume24 > cur.volume24) cur.volume24 = a.volume24;
    } else {
      bySymbol.set(a.baseSymbol, {
        poolAddress: a.poolAddress,
        baseSymbol: a.baseSymbol,
        baseAddress: a.baseAddress,
        baseDecimals: a.baseDecimals,
        quoteSymbol: a.quoteSymbol,
        priceUsd: a.priceUsd,
        volume24: a.volume24,
        liquidityUsd: 0,
        mcap: 0,
        fdv: 0,
        change1h: 0,
        change24h: 0,
        createdAt: null,
        isStock: a.isStock,
      });
    }
  }

  const tokens = [...bySymbol.values()].sort((a, b) => b.volume24 - a.volume24).slice(0, 60).map(row);

  const stats = {
    tokens: tokens.length,
    volume24: tokens.reduce((s, t) => s + t.volume24, 0),
    liquidity: tokens.reduce((s, t) => s + t.liquidityUsd, 0),
  };

  return NextResponse.json({ tokens, stats }, { headers: { "cache-control": "no-store" } });
}
