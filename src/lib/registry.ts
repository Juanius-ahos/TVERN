// Data sources that work keyless from a normal IP (Blockscout is Cloudflare-gated):
//  - GeckoTerminal: top pools + recent trades for network "robinhood"
//  - DexScreener also indexes chainId "robinhood" (used as a fallback price source)

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
  quoteSymbol: string;
  priceUsd: number;
  volume24: number;
  isStock: boolean;
};

let cache: { at: number; pools: Pool[] } | null = null;
const TTL = 3 * 60 * 1000;

export async function getActivePools(force = false): Promise<Pool[]> {
  if (!force && cache && Date.now() - cache.at < TTL) return cache.pools;

  const pools: Pool[] = [];
  try {
    const url = `${GT}/networks/${NETWORK}/pools?page=1&sort=h24_volume_usd_desc&include=base_token,quote_token`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const tokenById = new Map<string, { symbol: string; address: string }>();
      for (const inc of data.included ?? []) {
        if (inc.type === "token") {
          tokenById.set(inc.id, {
            symbol: String(inc.attributes?.symbol ?? "").toUpperCase(),
            address: String(inc.attributes?.address ?? "").toLowerCase(),
          });
        }
      }
      for (const p of data.data ?? []) {
        const a = p.attributes ?? {};
        const baseId = p.relationships?.base_token?.data?.id;
        const quoteId = p.relationships?.quote_token?.data?.id;
        const base = baseId ? tokenById.get(baseId) : undefined;
        const quote = quoteId ? tokenById.get(quoteId) : undefined;
        const baseSymbol = (base?.symbol || String(a.name ?? "").split(" / ")[0] || "").toUpperCase();
        const quoteSymbol = (quote?.symbol || String(a.name ?? "").split(" / ")[1] || "").toUpperCase();
        if (!baseSymbol) continue;
        // We report the BASE token as the asset — if it's a stable/wrapped, it's not
        // interesting content (e.g. "sold $X of USDB"). Skip those pools entirely.
        if (PLUMBING.has(baseSymbol)) continue;
        pools.push({
          poolAddress: String(a.address ?? "").toLowerCase(),
          baseSymbol,
          baseAddress: base?.address ?? "",
          quoteSymbol,
          priceUsd: Number(a.base_token_price_usd ?? 0),
          volume24: Number(a.volume_usd?.h24 ?? 0),
          isStock: KNOWN_TICKERS.has(baseSymbol),
        });
      }
    }
  } catch {
    // ignore
  }

  cache = { at: Date.now(), pools };
  return pools;
}
