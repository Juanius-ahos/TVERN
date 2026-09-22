import { NextResponse } from "next/server";
import { getActivePools } from "@/lib/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type TickerItem = {
  symbol: string;
  priceUsd: number;
  volume24: number;
  isStock: boolean;
};

// Top RH-Chain movers by 24h volume, deduped to one row per asset.
export async function GET() {
  const pools = await getActivePools();
  const seen = new Set<string>();
  const items: TickerItem[] = [];
  for (const p of pools) {
    if (seen.has(p.baseSymbol)) continue;
    if (p.priceUsd <= 0) continue;
    seen.add(p.baseSymbol);
    items.push({
      symbol: p.baseSymbol,
      priceUsd: p.priceUsd,
      volume24: p.volume24,
      isStock: p.isStock,
    });
    if (items.length >= 20) break;
  }
  return NextResponse.json({ items });
}
