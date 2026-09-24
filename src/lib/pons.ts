import { parseAbi, parseAbiItem, type Address } from "viem";
import { publicClient } from "./chain";
import { prisma } from "./db";
import { redis } from "./redis";
import { shortAddr } from "./format";

// Pons Family launch indexer. Reads the factory's TokenLaunched event straight
// off Robinhood Chain, so a fresh launch shows up in The Tavern the moment it
// hits a block, instead of waiting for GeckoTerminal to discover the pool.
//
// Integration surface published at https://docs.ponsfamily.com (Integration).
// Every launch deploys a token + its locked WETH pool in one transaction, and
// the token is self-describing on-chain (name/symbol/decimals/logo/pool).

const CURSOR_ID = "pons-launches";

// Deployed factories on Robinhood Chain (active serves current launches; legacy
// stays for tokens deployed before the current version). Both emit TokenLaunched.
export const PONS = {
  activeFactory: "0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB" as Address,
  legacyFactory: "0x0c37a24F5D23A486FA692d1500881d698B1F77a4" as Address,
  weth: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as Address,
  activeStartBlock: 8991118,
} as const;

const FACTORIES: Address[] = [PONS.activeFactory, PONS.legacyFactory];

// event TokenLaunched(address indexed token, address indexed deployer, address indexed dexFactory,
//   address pairToken, address pool, uint256 dexId, uint256 launchConfigId, uint256 positionId,
//   uint256 restrictionsEndBlock, uint256 initialBuyAmount)
const tokenLaunchedEvent = parseAbiItem(
  "event TokenLaunched(address indexed token, address indexed deployer, address indexed dexFactory, address pairToken, address pool, uint256 dexId, uint256 launchConfigId, uint256 positionId, uint256 restrictionsEndBlock, uint256 initialBuyAmount)"
);

// The launch token describes itself on-chain.
const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

// graduationStatus(token) -> (pairedPrincipal, threshold, graduated). Best-effort.
const graduationAbi = [
  parseAbiItem(
    "function graduationStatus(address token) view returns (uint256 pairedPrincipal, uint256 threshold, bool graduated)"
  ),
] as const;

// Robinhood Chain runs ~101ms blocks (measured), so one day is ~855k blocks.
// Launches are sparse, so on the first pass we backfill ~3 days and then walk
// forward chunk by chunk until the cursor catches up to the head.
const BACKFILL_BLOCKS = Number(process.env.PONS_BACKFILL ?? 2_600_000);
// Max blocks per pass. The public RPC accepts a ~20k window on a single indexed
// event filter (tested); we advance the cursor by this much each pass.
const MAX_BLOCK_SPAN = Number(process.env.PONS_MAX_SPAN ?? 20_000);
const BLOCK_MS = 101;

type LaunchMeta = { symbol: string; name: string; graduated: boolean; progress: number };

async function readLaunchMeta(token: Address, factory: Address): Promise<LaunchMeta> {
  let symbol = "";
  let name = "";
  try {
    const [s, n] = await Promise.all([
      publicClient.readContract({ address: token, abi: tokenAbi, functionName: "symbol" }),
      publicClient.readContract({ address: token, abi: tokenAbi, functionName: "name" }),
    ]);
    symbol = String(s ?? "").trim();
    name = String(n ?? "").trim();
  } catch {
    // token not readable yet; fall back to the address
  }
  if (!symbol) symbol = shortAddr(token).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "NEW";

  let graduated = false;
  let progress = 0;
  try {
    const [paired, threshold, grad] = await publicClient.readContract({
      address: factory,
      abi: graduationAbi,
      functionName: "graduationStatus",
      args: [token],
    });
    graduated = Boolean(grad);
    const t = Number(threshold);
    if (t > 0) progress = Math.min(1, Number(paired) / t);
  } catch {
    // graduation view is optional; a launch still gets indexed without it
  }

  return { symbol, name, graduated, progress };
}

export async function runPonsIndexer(): Promise<{ scanned: number; created: number; from: number; to: number }> {
  let created = 0;
  let scanned = 0;

  const current = await publicClient.getBlockNumber();
  const cursor = await prisma.indexerState.findUnique({ where: { id: CURSOR_ID } });
  let fromBlock = cursor ? BigInt(cursor.lastBlock) + BigInt(1) : current - BigInt(BACKFILL_BLOCKS);
  if (fromBlock < BigInt(0)) fromBlock = BigInt(0);
  if (fromBlock > current) return { scanned, created, from: Number(fromBlock), to: Number(current) };

  // Walk forward one window at a time so a large backfill catches up over
  // several passes instead of snapping the cursor straight to the head.
  let toBlock = fromBlock + BigInt(MAX_BLOCK_SPAN);
  if (toBlock > current) toBlock = current;

  let logs;
  try {
    logs = await publicClient.getLogs({
      address: FACTORIES,
      event: tokenLaunchedEvent,
      fromBlock,
      toBlock,
    });
  } catch {
    return { scanned, created, from: Number(fromBlock), to: Number(toBlock) };
  }

  // One reference timestamp; estimate per-log time from block distance.
  const head = await publicClient.getBlock({ blockNumber: current });
  const headMs = Number(head.timestamp) * 1000;
  const tsFor = (block: bigint) => new Date(headMs - Number(current - block) * BLOCK_MS);

  for (const l of logs) {
    scanned++;
    const token = l.args.token as Address | undefined;
    const pool = l.args.pool as Address | undefined;
    const deployer = l.args.deployer as Address | undefined;
    if (!token || !pool) continue;

    const factory = (l.address as Address) ?? PONS.activeFactory;
    const meta = await readLaunchMeta(token, factory);

    const nameNote = meta.name && meta.name.toLowerCase() !== meta.symbol.toLowerCase() ? ` (${meta.name})` : "";
    const gradNote = meta.graduated
      ? " · graduated"
      : meta.progress > 0
      ? ` · ${Math.round(meta.progress * 100)}% to graduation`
      : "";
    const title = `$${meta.symbol}${nameNote} just launched on Pons${gradNote}`;

    try {
      await prisma.event.upsert({
        // Synthetic key: one launch event per pool, ever. Dedupes cleanly with
        // the GeckoTerminal ingest, which uses the same launch:<pool> key.
        where: { txHash_logIndex: { txHash: `launch:${pool.toLowerCase()}`, logIndex: 0 } },
        create: {
          kind: "LAUNCH",
          txHash: `launch:${pool.toLowerCase()}`,
          logIndex: 0,
          blockNumber: Number(l.blockNumber ?? BigInt(0)),
          blockTs: tsFor(l.blockNumber ?? current),
          assetSymbol: meta.symbol,
          assetAddress: token.toLowerCase(),
          fromAddr: pool.toLowerCase(),
          toAddr: (deployer ?? "").toLowerCase(),
          amountRaw: "0",
          amountUi: 0,
          usdValue: 0,
          // Launches rank prominently; graduated ones a notch higher.
          severity: meta.graduated ? 60_000 : 35_000,
          title,
        },
        update: {},
      });
      created++;
    } catch {
      // dup / race
    }
  }

  await prisma.indexerState.upsert({
    where: { id: CURSOR_ID },
    create: { id: CURSOR_ID, lastBlock: Number(toBlock) },
    update: { lastBlock: Number(toBlock) },
  });

  return { scanned, created, from: Number(fromBlock), to: Number(toBlock) };
}

// Traffic-driven, self-throttled. One caller per interval runs a pass.
const PONS_INTERVAL = Number(process.env.PONS_SECONDS ?? 30);
let lastLocalPons = 0;

export async function maybePonsIndex(): Promise<void> {
  const now = Date.now();
  if (redis) {
    try {
      const ok = await redis.set("pons:lock", now, { nx: true, ex: PONS_INTERVAL });
      if (ok !== "OK") return;
    } catch {
      return;
    }
  } else {
    if (now - lastLocalPons < PONS_INTERVAL * 1000) return;
    lastLocalPons = now;
  }
  try {
    await runPonsIndexer();
  } catch {
    // best-effort; GeckoTerminal ingest still discovers launches on a delay
  }
}
