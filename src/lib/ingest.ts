import { prisma } from "./db";
import { getActivePools, type Pool } from "./registry";
import { formatUsd, shortAddr } from "./format";

const GT = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood";
const MIN_USD = Number(process.env.MIN_EVENT_USD ?? 5000);
const MAX_POOLS = Number(process.env.MAX_POOLS ?? 18);
const MAX_TRADES_PER_POOL = Number(process.env.MAX_TRADES_PER_POOL ?? 6);

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

  return { pools: pools.length, scanned, created };
}

// --- Demo seed: realistic sample events so the UI works before live data flows ---
export async function seedDemoEvents(): Promise<number> {
  const samples: Array<[string, number, "WHALE" | "BUY" | "SELL"]> = [
    ["NVDA", 187_420, "WHALE"],
    ["GME", 42_000, "BUY"],
    ["TSLA", 96_500, "SELL"],
    ["AAPL", 12_300, "BUY"],
    ["SPY", 250_000, "WHALE"],
    ["MSTR", 61_800, "BUY"],
    ["HOOD", 8_900, "SELL"],
    ["META", 133_000, "WHALE"],
  ];
  const rand = () =>
    "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

  let n = 0;
  for (let i = 0; i < samples.length; i++) {
    const [symbol, usd, kind] = samples[i];
    const from = rand();
    const emoji = kind === "WHALE" ? "🐋" : kind === "BUY" ? "📈" : "📉";
    const verb = kind === "SELL" ? "sold" : kind === "BUY" ? "bought" : "moved";
    const txHash = rand() + rand().slice(2, 26);
    try {
      await prisma.event.create({
        data: {
          kind,
          txHash,
          logIndex: i,
          blockNumber: 68_000_000 + i,
          blockTs: new Date(Date.now() - i * 1000 * 60 * 7),
          assetSymbol: symbol,
          assetAddress: rand(),
          fromAddr: from,
          toAddr: rand(),
          amountRaw: String(Math.round(usd / 100)),
          amountUi: usd / 100,
          usdValue: usd,
          severity: usd * 3,
          title: `${emoji} ${shortAddr(from)} ${verb} ${formatUsd(usd)} of ${symbol}`,
        },
      });
      n++;
    } catch {
      // ignore dupes
    }
  }
  return n;
}
