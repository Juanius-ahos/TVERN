import { parseAbiItem, formatUnits, type Address } from "viem";
import { publicClient } from "./chain";
import { prisma } from "./db";
import { getActivePools, resolvePool } from "./registry";
import { redis } from "./redis";
import { formatUsd, shortAddr } from "./format";

// Our own on-chain indexer: reads ERC-20 Transfer logs to/from each active DEX
// pool straight from the Robinhood Chain RPC and turns them into trade events.
// Universal (Transfer has one signature for every token), so it works no matter
// which DEX the pool belongs to. Runs alongside the GeckoTerminal ingest; both
// upsert into Event and dedupe on (txHash, logIndex).

const CURSOR_ID = "rh-transfers";
const MAX_BLOCK_SPAN = 900; // cap the log window per pass
const MIN_USD = Number(process.env.INDEX_MIN_USD ?? 300);
const POOLS_PER_PASS = Number(process.env.INDEX_POOLS ?? 10);
const BLOCK_MS = 250; // ~ Robinhood Chain block time, for timestamp estimation

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function runIndexer(): Promise<{ scanned: number; created: number; from: number; to: number }> {
  let created = 0;
  let scanned = 0;

  const pools = (await getActivePools())
    .filter((p) => p.baseAddress && p.poolAddress && p.priceUsd > 0)
    .slice(0, POOLS_PER_PASS);
  if (pools.length === 0) return { scanned, created, from: 0, to: 0 };

  const current = await publicClient.getBlockNumber();
  const cursor = await prisma.indexerState.findUnique({ where: { id: CURSOR_ID } });
  let fromBlock = cursor ? BigInt(cursor.lastBlock) + BigInt(1) : current - BigInt(300);
  if (current - fromBlock > BigInt(MAX_BLOCK_SPAN)) fromBlock = current - BigInt(MAX_BLOCK_SPAN);
  if (fromBlock < BigInt(0)) fromBlock = BigInt(0);
  if (fromBlock > current) return { scanned, created, from: Number(fromBlock), to: Number(current) };

  // One reference timestamp; estimate per-log time from block distance.
  const head = await publicClient.getBlock({ blockNumber: current });
  const headMs = Number(head.timestamp) * 1000;
  const tsFor = (block: bigint) => new Date(headMs - Number(current - block) * BLOCK_MS);

  for (const pool of pools) {
    const token = pool.baseAddress as Address;
    const poolAddr = pool.poolAddress.toLowerCase();

    // Buys: token leaves the pool (pool -> user). Sells: token enters the pool.
    let logs;
    try {
      const [buys, sells] = await Promise.all([
        publicClient.getLogs({ address: token, event: transferEvent, args: { from: poolAddr as Address }, fromBlock, toBlock: current }),
        publicClient.getLogs({ address: token, event: transferEvent, args: { to: poolAddr as Address }, fromBlock, toBlock: current }),
      ]);
      logs = [
        ...buys.map((l) => ({ l, side: "buy" as const })),
        ...sells.map((l) => ({ l, side: "sell" as const })),
      ];
    } catch {
      continue; // RPC hiccup on this token, skip, GT ingest still covers it
    }

    for (const { l, side } of logs) {
      scanned++;
      const value = l.args.value ?? BigInt(0);
      const amount = Number(formatUnits(value, pool.baseDecimals));
      const usd = amount * pool.priceUsd;
      if (!isFinite(usd) || usd < MIN_USD) continue;

      const wallet = String(side === "buy" ? l.args.to : l.args.from).toLowerCase();
      if (!wallet || wallet === poolAddr || wallet === "0x0000000000000000000000000000000000000000") continue;

      const kind = usd >= 50_000 ? "WHALE" : side === "buy" ? "BUY" : "SELL";
      const verb = side === "buy" ? "bought" : "sold";
      try {
        await prisma.event.upsert({
          where: { txHash_logIndex: { txHash: l.transactionHash, logIndex: l.logIndex } },
          create: {
            kind,
            txHash: l.transactionHash,
            logIndex: l.logIndex,
            blockNumber: Number(l.blockNumber),
            blockTs: tsFor(l.blockNumber),
            assetSymbol: pool.baseSymbol,
            assetAddress: pool.baseAddress,
            fromAddr: wallet,
            toAddr: poolAddr,
            amountRaw: value.toString(),
            amountUi: amount,
            usdValue: usd,
            severity: pool.isStock ? usd * 3 : usd,
            title: `${shortAddr(wallet)} ${verb} ${formatUsd(usd)} of ${pool.baseSymbol}`,
          },
          update: {},
        });
        created++;
      } catch {
        // dup / race
      }
    }
  }

  await prisma.indexerState.upsert({
    where: { id: CURSOR_ID },
    create: { id: CURSOR_ID, lastBlock: Number(current) },
    update: { lastBlock: Number(current) },
  });

  return { scanned, created, from: Number(fromBlock), to: Number(current) };
}

// On-demand: index just one token's pool when its page is opened, so even a
// small or brand-new coin (not in the top pools the main pass scans) gets
// seconds-fresh trades straight off the chain. Rescans a short recent window;
// upserts dedupe, so repeated polls are cheap.
const SYMBOL_SPAN = Number(process.env.INDEX_SYMBOL_SPAN ?? 1800); // ~3 min at 0.1s blocks
const SYMBOL_MIN_USD = Number(process.env.INDEX_SYMBOL_MIN_USD ?? 5);

export async function indexSymbol(symbol: string): Promise<{ created: number }> {
  let created = 0;
  const pool = await resolvePool(symbol.toUpperCase());
  if (!pool?.poolAddress || !pool.baseAddress || !(pool.priceUsd > 0)) return { created };

  const token = pool.baseAddress as Address;
  const poolAddr = pool.poolAddress.toLowerCase();
  const current = await publicClient.getBlockNumber();
  let fromBlock = current - BigInt(SYMBOL_SPAN);
  if (fromBlock < BigInt(0)) fromBlock = BigInt(0);

  let logs;
  try {
    const [buys, sells] = await Promise.all([
      publicClient.getLogs({ address: token, event: transferEvent, args: { from: poolAddr as Address }, fromBlock, toBlock: current }),
      publicClient.getLogs({ address: token, event: transferEvent, args: { to: poolAddr as Address }, fromBlock, toBlock: current }),
    ]);
    logs = [
      ...buys.map((l) => ({ l, side: "buy" as const })),
      ...sells.map((l) => ({ l, side: "sell" as const })),
    ];
  } catch {
    return { created };
  }

  const head = await publicClient.getBlock({ blockNumber: current });
  const headMs = Number(head.timestamp) * 1000;
  const tsFor = (block: bigint) => new Date(headMs - Number(current - block) * BLOCK_MS);

  for (const { l, side } of logs) {
    const value = l.args.value ?? BigInt(0);
    const amount = Number(formatUnits(value, pool.baseDecimals));
    const usd = amount * pool.priceUsd;
    if (!isFinite(usd) || usd < SYMBOL_MIN_USD) continue;
    const wallet = String(side === "buy" ? l.args.to : l.args.from).toLowerCase();
    if (!wallet || wallet === poolAddr || wallet === "0x0000000000000000000000000000000000000000") continue;
    const kind = usd >= 50_000 ? "WHALE" : side === "buy" ? "BUY" : "SELL";
    const verb = side === "buy" ? "bought" : "sold";
    try {
      await prisma.event.upsert({
        where: { txHash_logIndex: { txHash: l.transactionHash, logIndex: l.logIndex } },
        create: {
          kind,
          txHash: l.transactionHash,
          logIndex: l.logIndex,
          blockNumber: Number(l.blockNumber),
          blockTs: tsFor(l.blockNumber),
          assetSymbol: pool.baseSymbol,
          assetAddress: pool.baseAddress,
          fromAddr: wallet,
          toAddr: poolAddr,
          amountRaw: value.toString(),
          amountUi: amount,
          usdValue: usd,
          severity: pool.isStock ? usd * 3 : usd,
          title: `${shortAddr(wallet)} ${verb} ${formatUsd(usd)} of ${pool.baseSymbol}`,
        },
        update: {},
      });
      created++;
    } catch {
      // dup / race
    }
  }
  return { created };
}

// Per-symbol throttle so the asset page's 6s polling does not stack passes.
const SYMBOL_INTERVAL = Number(process.env.INDEX_SYMBOL_SECONDS ?? 6);
const lastLocalSymbol = new Map<string, number>();

export async function maybeIndexSymbol(symbol: string): Promise<void> {
  const key = symbol.toUpperCase();
  const now = Date.now();
  if (redis) {
    try {
      const ok = await redis.set(`indexer:sym:${key}`, now, { nx: true, ex: SYMBOL_INTERVAL });
      if (ok !== "OK") return;
    } catch {
      return;
    }
  } else {
    if (now - (lastLocalSymbol.get(key) ?? 0) < SYMBOL_INTERVAL * 1000) return;
    lastLocalSymbol.set(key, now);
  }
  try {
    await indexSymbol(key);
  } catch {
    // best-effort
  }
}

// Traffic-driven, self-throttled, one caller per interval runs a pass.
const INDEX_INTERVAL = Number(process.env.INDEX_SECONDS ?? 45);
let lastLocalIndex = 0;

export async function maybeAutoIndex(): Promise<void> {
  const now = Date.now();
  if (redis) {
    try {
      const ok = await redis.set("indexer:lock", now, { nx: true, ex: INDEX_INTERVAL });
      if (ok !== "OK") return;
    } catch {
      return;
    }
  } else {
    if (now - lastLocalIndex < INDEX_INTERVAL * 1000) return;
    lastLocalIndex = now;
  }
  try {
    await runIndexer();
  } catch {
    // best-effort; GeckoTerminal ingest remains the baseline
  }
}
