import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { maybeAutoIngest } from "@/lib/ingest";
import { maybeAutoIndex } from "@/lib/indexer";
import { maybePonsIndex } from "@/lib/pons";
import { maybePrune } from "@/lib/prune";

export const dynamic = "force-dynamic";

// GET /api/tape?min=&wallet=&kind= → recent on-chain trades (DB-backed, instant).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const min = Number(url.searchParams.get("min") ?? 0);
  const wallet = (url.searchParams.get("wallet") ?? "").toLowerCase();
  const kind = url.searchParams.get("kind"); // e.g. "LAUNCH"

  // Keep the tape warm off traffic: our own RPC indexer + the GeckoTerminal ingest.
  after(async () => {
    await Promise.allSettled([maybeAutoIndex(), maybeAutoIngest(), maybePonsIndex(), maybePrune()]);
  });

  const where: Record<string, unknown> = {};
  if (min > 0) where.usdValue = { gte: min };
  if (kind) where.kind = kind;
  else where.kind = { in: ["BUY", "SELL", "WHALE", "LAUNCH"] };
  if (wallet) where.OR = [{ fromAddr: wallet }, { toAddr: wallet }];

  const rows = await prisma.event.findMany({
    where,
    orderBy: { blockTs: "desc" },
    take: 60,
    select: {
      id: true,
      kind: true,
      assetSymbol: true,
      fromAddr: true,
      usdValue: true,
      txHash: true,
      blockTs: true,
      title: true,
    },
  });

  const trades = rows.map((e) => ({
    id: e.id,
    kind: e.kind,
    symbol: e.assetSymbol,
    wallet: e.fromAddr,
    usd: e.usdValue,
    txHash: e.txHash,
    ts: e.blockTs.toISOString(),
    title: e.title,
  }));

  return NextResponse.json({ trades }, { headers: { "cache-control": "no-store" } });
}
