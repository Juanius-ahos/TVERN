import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GT = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  // token address: from an indexed event (fallback), else nothing
  const ev = await prisma.event.findFirst({
    where: { assetSymbol: sym, assetAddress: { not: "" } },
    select: { assetAddress: true },
  });
  const tokenAddr = ev?.assetAddress;
  if (!tokenAddr) return NextResponse.json({ points: [], pool: null });

  try {
    // find the token's top pool
    const pr = await fetch(`${GT}/networks/${NETWORK}/tokens/${tokenAddr}/pools`, {
      headers: { accept: "application/json" },
    });
    const pd = await pr.json();
    const pool = pd.data?.[0]?.attributes?.address;
    if (!pool) return NextResponse.json({ points: [], pool: null });

    // hourly OHLCV
    const or = await fetch(`${GT}/networks/${NETWORK}/pools/${pool}/ohlcv/hour?aggregate=1&limit=72&currency=usd`, {
      headers: { accept: "application/json" },
    });
    const od = await or.json();
    const list: number[][] = od.data?.attributes?.ohlcv_list ?? [];
    // ohlcv_list = [timestamp, open, high, low, close, volume], newest first
    const points = list
      .map((r) => ({ t: r[0], c: r[4] }))
      .filter((p) => isFinite(p.c))
      .reverse();

    const last = points.at(-1)?.c ?? null;
    const dayAgo = points.length > 24 ? points[points.length - 25].c : points[0]?.c;
    const change24 = last && dayAgo ? ((last - dayAgo) / dayAgo) * 100 : null;

    return NextResponse.json({ points, pool, last, change24 });
  } catch {
    return NextResponse.json({ points: [], pool: null });
  }
}
