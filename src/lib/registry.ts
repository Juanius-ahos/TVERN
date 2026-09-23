// Data sources that work keyless from a normal IP (Blockscout is Cloudflare-gated):
//  - GeckoTerminal: top pools + recent trades for network "robinhood"
//  - DexScreener also indexes chainId "robinhood" (used as a fallback price source)
import { liveCached } from "./redis";

export const WETH = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
export const USDG = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";

const GT = "https://api.geckoterminal.com/api/v2";
const NETWORK = "robinhood";

// Tickers we treat as tokenized stocks/ETFs (highlighted specially in the feed).
export const KNOWN_TICKERS = new Set(
  [
    "NVDA", "TSLA", "AAPL", "GME", "MSFT", "AMZN", "GOOGL", "GOOG", "META",
    "AMD", "NFLX", "SPY", "QQQ", "COIN", "HOOD", "MSTR", "PLTR", "AMC",
    "INTC", "BABA", "DIS", "BA", "SBUX", "SPCX", "SPACEX", "OPENAI", "CRCL",
  ].map((s) => s.toUpperCase())
);

// Tokens that make a pair "boring" (pure stable/wrapped plumbing, not social content).
const PLUMBING = new Set([
  "WETH", "ETH", "USDG", "USDC", "USDT", "USDB", "USDE", "DAI", "FRAX",
  "WBTC", "CBBTC", "TBTC", "WSTETH", "WEETH",
]);

export type Pool = {
  poolAddress: string;
  baseSymbol: string;
  baseAddress: string;
  baseDecimals: number;
  quoteSymbol: string;
  priceUsd: number;
  volume24: number;
  isStock: boolean;
};

export async function getActivePools(): Promise<Pool[]> {
  return liveCached(
    "gt:pools:active",
    45,
    async () => {
      const pools: Pool[] = [];
      const url = `${GT}/networks/${NETWORK}/pools?page=1&sort=h24_volume_usd_desc&include=base_token,quote_token`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) {
        for (const p of parsePools(await res.json())) {
          pools.push({
            poolAddress: p.poolAddress,
            baseSymbol: p.baseSymbol,
            baseAddress: p.baseAddress,
            baseDecimals: p.baseDecimals,
            quoteSymbol: p.quoteSymbol,
            priceUsd: p.priceUsd,
            volume24: p.volume24,
            isStock: p.isStock,
          });
        }
      }
      return pools;
    },
    (p) => p.length === 0
  );
}

// A richer view of a pool for discovery (new launches / trending movers).
export type DiscoverPool = {
  poolAddress: string;
  baseSymbol: string;
  baseAddress: string;
  baseDecimals: number;
  quoteSymbol: string;
  priceUsd: number;
  volume24: number;
  liquidityUsd: number;
  mcap: number;
  fdv: number;
  change1h: number;
  change24h: number;
  createdAt: string | null;
  isStock: boolean;
};

// Parse any GeckoTerminal "pools" style response into DiscoverPool[].
function parsePools(data: unknown): DiscoverPool[] {
  const out: DiscoverPool[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const tokenById = new Map<string, { symbol: string; address: string; decimals: number }>();
  for (const inc of d?.included ?? []) {
    if (inc.type === "token") {
      tokenById.set(inc.id, {
        symbol: String(inc.attributes?.symbol ?? "").toUpperCase(),
        address: String(inc.attributes?.address ?? "").toLowerCase(),
        decimals: Number(inc.attributes?.decimals ?? 18),
      });
    }
  }
  for (const p of d?.data ?? []) {
    const a = p.attributes ?? {};
    const baseId = p.relationships?.base_token?.data?.id;
    const quoteId = p.relationships?.quote_token?.data?.id;
    const base = baseId ? tokenById.get(baseId) : undefined;
    const quote = quoteId ? tokenById.get(quoteId) : undefined;
    const baseSymbol = (base?.symbol || String(a.name ?? "").split(" / ")[0] || "").toUpperCase();
    const quoteSymbol = (quote?.symbol || String(a.name ?? "").split(" / ")[1] || "").split(" ")[0].toUpperCase();
    if (!baseSymbol || PLUMBING.has(baseSymbol)) continue;
    out.push({
      poolAddress: String(a.address ?? "").toLowerCase(),
      baseSymbol,
      baseAddress: base?.address ?? "",
      baseDecimals: base?.decimals ?? 18,
      quoteSymbol,
      priceUsd: Number(a.base_token_price_usd ?? 0),
      volume24: Number(a.volume_usd?.h24 ?? 0),
      liquidityUsd: Number(a.reserve_in_usd ?? 0),
      mcap: Number(a.market_cap_usd ?? a.fdv_usd ?? 0),
      fdv: Number(a.fdv_usd ?? 0),
      change1h: Number(a.price_change_percentage?.h1 ?? 0),
      change24h: Number(a.price_change_percentage?.h24 ?? 0),
      createdAt: a.pool_created_at ?? null,
      isStock: KNOWN_TICKERS.has(baseSymbol),
    });
  }
  return out;
}

// Raw GeckoTerminal GET → parsed pools, through the shared last-known-good cache.
async function fetchPoolsCached(key: string, url: string, ttl = 45): Promise<DiscoverPool[]> {
  return liveCached(
    key,
    ttl,
    async () => {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`gt ${res.status}`);
      return parsePools(await res.json());
    },
    (p) => p.length === 0
  );
}

// Freshly created pools = new token launches.
export async function getNewPools(): Promise<DiscoverPool[]> {
  return fetchPoolsCached(
    "gt:new_pools",
    `${GT}/networks/${NETWORK}/new_pools?include=base_token,quote_token`,
    30
  );
}

// Trending pools = what's hot right now.
export async function getTrendingPools(): Promise<DiscoverPool[]> {
  return fetchPoolsCached(
    "gt:trending",
    `${GT}/networks/${NETWORK}/trending_pools?duration=1h&include=base_token,quote_token`,
    30
  );
}

// Live search results for a query (cached briefly, shared).
async function searchPoolsCached(query: string): Promise<DiscoverPool[]> {
  const q = query.trim();
  if (!q) return [];
  return fetchPoolsCached(
    `gt:search:${q.toLowerCase()}`,
    `${GT}/search/pools?query=${encodeURIComponent(q)}&network=${NETWORK}&include=base_token,quote_token`,
    120
  );
}

// Resolve ANY Robinhood-Chain token by symbol to its top pool + live market data.
export async function resolvePool(symbol: string): Promise<DiscoverPool | null> {
  const sym = symbol.toUpperCase();
  const matches = (await searchPoolsCached(sym))
    .filter((p) => p.baseSymbol === sym && p.priceUsd > 0)
    .sort((a, b) => b.volume24 - a.volume24);
  return matches[0] ?? null;
}

// Live token search by symbol/name — one entry per base token, ranked by volume.
export async function searchTokens(query: string): Promise<DiscoverPool[]> {
  const pools = await searchPoolsCached(query);
  const bySymbol = new Map<string, DiscoverPool>();
  for (const p of pools.sort((a, b) => b.volume24 - a.volume24)) {
    if (!bySymbol.has(p.baseSymbol)) bySymbol.set(p.baseSymbol, p);
  }
  return [...bySymbol.values()];
}

export type Trade = {
  side: "buy" | "sell";
  usd: number;
  amount: number;
  wallet: string;
  txHash: string;
  ts: string;
};

// Live trade tape for a token's top pool (newest first).
export async function getTradesForSymbol(symbol: string): Promise<Trade[]> {
  const pool = await resolvePool(symbol);
  if (!pool?.poolAddress) return [];
  return liveCached(
    `gt:trades:${pool.poolAddress}`,
    6,
    async () => {
      const res = await fetch(`${GT}/networks/${NETWORK}/pools/${pool.poolAddress}/trades`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`gt ${res.status}`);
      const d = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((d.data ?? []) as any[]).map((t) => {
        const a = t.attributes ?? {};
        const side: "buy" | "sell" = a.kind === "sell" ? "sell" : "buy";
        return {
          side,
          usd: Number(a.volume_in_usd ?? 0),
          amount: Number(side === "buy" ? a.to_token_amount : a.from_token_amount) || 0,
          wallet: String(a.tx_from_address ?? "").toLowerCase(),
          txHash: String(a.tx_hash ?? ""),
          ts: a.block_timestamp ?? new Date().toISOString(),
        } as Trade;
      });
    },
    (a) => a.length === 0
  );
}

export type TokenStats = {
  priceUsd: number;
  fdv: number;
  mcap: number;
  supply: number;
  volume24: number;
  liquidityUsd: number;
  change24h: number;
  quoteSymbol: string;
};

// Deep market stats for a token (price, FDV, market cap, supply) — live.
export async function getTokenStats(symbol: string): Promise<TokenStats | null> {
  const pool = await resolvePool(symbol);
  if (!pool) return null;
  const base = {
    priceUsd: pool.priceUsd,
    fdv: 0,
    mcap: 0,
    supply: 0,
    volume24: pool.volume24,
    liquidityUsd: pool.liquidityUsd,
    change24h: pool.change24h,
    quoteSymbol: pool.quoteSymbol,
  };
  if (!pool.baseAddress) return base;
  return liveCached(
    `gt:tokstats:${pool.baseAddress}`,
    30,
    async () => {
      const res = await fetch(`${GT}/networks/${NETWORK}/tokens/${pool.baseAddress}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`gt ${res.status}`);
      const a = (await res.json())?.data?.attributes ?? {};
      return {
        ...base,
        priceUsd: Number(a.price_usd ?? pool.priceUsd),
        fdv: Number(a.fdv_usd ?? 0),
        mcap: Number(a.market_cap_usd ?? a.fdv_usd ?? 0),
        supply: Number(a.total_supply ?? 0),
        volume24: Number(a.volume_usd?.h24 ?? pool.volume24),
      };
    },
    (s) => !s || s.priceUsd <= 0
  );
}
