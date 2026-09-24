import { NextResponse, after } from "next/server";
import { getTradesForSymbol, type Trade } from "@/lib/registry";
import { maybeIndexSymbol } from "@/lib/indexer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET → live trade tape for a token (newest first).
// Merges our own on-chain indexer (seconds fresh) with GeckoTerminal (broad
// coverage) so the tape moves as fast as the chain, not as fast as GT refreshes.
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  // Warm the fast source for this exact token, so the next poll is fresh even if
  // it is not one of the top pools the main indexer pass scans.
  after(async () => {
    await maybeIndexSymbol(sym);
  });

  const [dbEvents, gtTrades] = await Promise.all([
    prisma.event.findMany({
      where: { assetSymbol: sym, kind: { in: ["BUY", "SELL"] } },
      orderBy: { blockTs: "desc" },
      take: 60,
      select: { kind: true, usdValue: true, amountUi: true, fromAddr: true, txHash: true, blockTs: true },
    }),
    getTradesForSymbol(sym).catch(() => [] as Trade[]),
  ]);

  const dbTrades: Trade[] = dbEvents.map((e) => ({
    side: e.kind === "SELL" ? "sell" : "buy",
    usd: e.usdValue,
    amount: e.amountUi,
    wallet: e.fromAddr,
    txHash: e.txHash,
    ts: e.blockTs.toISOString(),
  }));

  // Merge, prefer our fresh rows, dedupe by tx hash, newest first.
  const seen = new Set<string>();
  const merged: Trade[] = [];
  for (const t of [...dbTrades, ...gtTrades]) {
    const key = t.txHash || `${t.wallet}-${t.ts}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(t);
  }
  merged.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return NextResponse.json({ trades: merged.slice(0, 50) }, { headers: { "cache-control": "no-store" } });
}
