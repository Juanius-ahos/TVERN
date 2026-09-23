import { NextResponse } from "next/server";
import { publicClient } from "@/lib/chain";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// cache ETH price briefly to be nice to the price API
let ethCache: { at: number; usd: number } | null = null;
async function ethUsd(): Promise<number | null> {
  if (ethCache && Date.now() - ethCache.at < 30_000) return ethCache.usd;
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { headers: { accept: "application/json" } }
    );
    const d = await r.json();
    const usd = Number(d?.ethereum?.usd);
    if (usd > 0) ethCache = { at: Date.now(), usd };
    return usd || ethCache?.usd || null;
  } catch {
    return ethCache?.usd ?? null;
  }
}

export async function GET() {
  const [block, gas, events24, eth] = await Promise.all([
    publicClient.getBlockNumber().catch(() => null),
    publicClient.getGasPrice().catch(() => null),
    prisma.event.count({
      where: { blockTs: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    ethUsd(),
  ]);

  return NextResponse.json(
    {
      block: block ? Number(block) : null,
      gasGwei: gas ? Number(gas) / 1e9 : null,
      chainId: 4663,
      blockTime: "0.1s",
      events24,
      ethUsd: eth,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
