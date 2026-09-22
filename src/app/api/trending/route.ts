import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNOWN_TICKERS } from "@/lib/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  // Look at the last 24h of events.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const grouped = await prisma.event.groupBy({
    by: ["assetSymbol"],
    where: { blockTs: { gte: since } },
    _count: { _all: true },
    _sum: { usdValue: true },
    orderBy: { _sum: { usdValue: "desc" } },
    take: 8,
  });

  const trending = grouped.map((g) => ({
    symbol: g.assetSymbol,
    events: g._count._all,
    volume: g._sum.usdValue ?? 0,
    isStock: KNOWN_TICKERS.has(g.assetSymbol.toUpperCase()),
  }));

  const biggest = await prisma.event.findMany({
    where: { blockTs: { gte: since } },
    orderBy: { usdValue: "desc" },
    take: 5,
    select: { id: true, title: true, assetSymbol: true, usdValue: true, kind: true },
  });

  return NextResponse.json({ trending, biggest });
}
