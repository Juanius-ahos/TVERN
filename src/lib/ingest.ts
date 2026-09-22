import { prisma } from "./db";
import { getActivePools, getNewPools, type Pool } from "./registry";
import { formatUsd, shortAddr } from "./format";
import { redis } from "./redis";

const GT = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood";
const MIN_USD = Number(process.env.MIN_EVENT_USD ?? 5000);
const MAX_POOLS = Number(process.env.MAX_POOLS ?? 18);
const MAX_TRADES_PER_POOL = Number(process.env.MAX_TRADES_PER_POOL ?? 6);
const MIN_LAUNCH_LIQ = Number(process.env.MIN_LAUNCH_LIQ ?? 1000);

type Trade = {
  txHash: string;
  block: number;
  ts: Date;
  wallet: string;
  kind: "buy" | "sell";
  usd: number;
  baseAmount: number;
};

async function fetchTrades(pool: Pool): Promise<Trade[]> {
  const out: Trade[] = [];
  try {
    const url = `${GT}/networks/${NETWORK}/pools/${pool.poolAddress}/trades?trade_volume_in_usd_greater_than=${MIN_USD}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return out;
    const data = await res.json();
    for (const t of data.data ?? []) {
      const a = t.attributes ?? {};
      const kind: "buy" | "sell" = a.kind === "sell" ? "sell" : "buy";
      const usd = Number(a.volume_in_usd ?? 0);
      // base token amount: on a buy the base is the "to" token, on a sell the "from" token
      const baseAmount =
        kind === "buy" ? Number(a.to_token_amount ?? 0) : Number(a.from_token_amount ?? 0);
      out.push({
        txHash: String(a.tx_hash ?? ""),
        block: Number(a.block_number ?? 0),
        ts: a.block_timestamp ? new Date(a.block_timestamp) : new Date(),
        wallet: String(a.tx_from_address ?? "").toLowerCase(),
        kind,
        usd,
        baseAmount,
      });
    }
  } catch {
    // ignore
  }
  return out;
}

function headline(pool: Pool, tr: Trade): { kind: string; title: string } {
  const big = tr.usd >= 50_000;
  const verb = tr.kind === "buy" ? "bought" : "sold";
  const kind = big ? "WHALE" : tr.kind === "buy" ? "BUY" : "SELL";
  return {
    kind,
    title: `${shortAddr(tr.wallet)} ${verb} ${formatUsd(tr.usd)} of ${pool.baseSymbol}`,
  };
}

// synthetic per-pool offset so two trades of different pools in one tx don't collide
function poolOffset(addr: string): number {
  return parseInt(addr.slice(2, 8) || "0", 16) % 900000;
}

export async function runIngest(): Promise<{ pools: number; scanned: number; created: number }> {
  const pools = (await getActivePools()).slice(0, MAX_POOLS);
  let scanned = 0;
  let created = 0;

  for (const pool of pools) {
    if (!pool.poolAddress) continue;
    const trades = (await fetchTrades(pool))
      .filter((t) => t.txHash && t.usd >= MIN_USD)
      .sort((a, b) => b.usd - a.usd)
      .slice(0, MAX_TRADES_PER_POOL);
    for (const tr of trades) {
      scanned++;
      const { kind, title } = headline(pool, tr);
      const logIndex = poolOffset(pool.poolAddress);
      try {
        await prisma.event.upsert({
          where: { txHash_logIndex: { txHash: tr.txHash, logIndex } },
          create: {
            kind,
            txHash: tr.txHash,
            logIndex,
            blockNumber: tr.block,
            blockTs: tr.ts,
            assetSymbol: pool.baseSymbol,
            assetAddress: pool.baseAddress,
            fromAddr: tr.wallet,
            toAddr: pool.poolAddress,
            amountRaw: String(Math.round(tr.baseAmount)),
            amountUi: tr.baseAmount,
            usdValue: tr.usd,
            severity: pool.isStock ? tr.usd * 3 : tr.usd, // rank stock events higher
            title,
          },
          update: {},
        });
        created++;
      } catch {
        // dup / race
      }
    }
  }

  // --- New token launches: freshly created pools with real liquidity ---
  try {
    const fresh = (await getNewPools())
      .filter(
        (p) =>
          p.poolAddress &&
          p.baseSymbol &&
          (p.liquidityUsd >= MIN_LAUNCH_LIQ || p.volume24 >= 1000)
      )
      .slice(0, 20);
    for (const p of fresh) {
      const ts = p.createdAt ? new Date(p.createdAt) : new Date();
      const pairNote = p.quoteSymbol ? ` (${p.baseSymbol}/${p.quoteSymbol})` : "";
      const title = `$${p.baseSymbol} just launched${pairNote} · ${formatUsd(p.liquidityUsd)} liquidity`;
      try {
        await prisma.event.upsert({
          // Synthetic id: one launch event per pool, ever.
          where: { txHash_logIndex: { txHash: `launch:${p.poolAddress}`, logIndex: 0 } },
          create: {
            kind: "LAUNCH",
            txHash: `launch:${p.poolAddress}`,
            logIndex: 0,
            blockNumber: 0,
            blockTs: ts,
            assetSymbol: p.baseSymbol,
            assetAddress: p.baseAddress,
            fromAddr: p.poolAddress,
            toAddr: "",
            amountRaw: "0",
            amountUi: 0,
            usdValue: p.liquidityUsd,
            severity: (p.isStock ? 3 : 1) * (p.liquidityUsd + 25_000), // launches rank prominently
            title,
          },
          update: {},
        });
        created++;
      } catch {
        // dup / race
      }
    }
  } catch {
    // launches are best-effort
  }

  return { pools: pools.length, scanned, created };
}

// How stale the feed may get before a page view triggers a refresh.
const AUTO_INGEST_INTERVAL = Number(process.env.AUTO_INGEST_SECONDS ?? 240);
let lastLocalIngest = 0; // fallback when Redis is unavailable

/**
 * Acquire a short lock and, if it's been long enough since the last run,
 * refresh on-chain events. Meant to be fired via `after()` on hot routes so
 * live traffic keeps the feed fresh — no external cron or secret required.
 * Only one caller per interval wins the lock; everyone else is a no-op.
 */
export async function maybeAutoIngest(): Promise<void> {
  const now = Date.now();
  if (redis) {
    try {
      // NX+EX means exactly one request per interval acquires the lock.
      const ok = await redis.set("ingest:auto-lock", now, { nx: true, ex: AUTO_INGEST_INTERVAL });
      if (ok !== "OK") return;
    } catch {
      return; // if Redis errors, don't risk stampeding ingest
    }
  } else {
    if (now - lastLocalIngest < AUTO_INGEST_INTERVAL * 1000) return;
    lastLocalIngest = now;
  }
  try {
    await runIngest();
  } catch {
    /* best-effort; never surfaces to the user */
  }
}
