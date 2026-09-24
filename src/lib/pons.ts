import { prisma } from "./db";
import { redis } from "./redis";
import { formatUsd } from "./format";

// Pons Family launch feed. Pons runs its own launch factories on Robinhood Chain
// and rev's them (the current one is a v2 factory the public docs list under a
// different tab, with a different event topic than v1). Rather than decode raw
// factory logs against addresses that change every version, we read Pons's own
// launches API, which already resolves token, symbol, logo, market cap and
// graduation progress across every factory version.
//
// Source: https://www.ponsfamily.com/api/pons-launches (the Explore feed).

const PONS_API = "https://www.ponsfamily.com/api/pons-launches";
const PONS_IPFS = "https://www.ponsfamily.com/api/ipfs/content";
const PAGE_SIZE = Number(process.env.PONS_PAGE_SIZE ?? 40);
const AGE = process.env.PONS_AGE ?? "24h";
const ZERO = "0x0000000000000000000000000000000000000000";

// Resolve a token logo to a loadable URL. Pons stores logos on IPFS and serves a
// card-sized variant through its own gateway, which is what its app renders.
function logoUrl(logo?: string): string | null {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  const cid = logo.replace(/^ipfs:\/\//i, "").replace(/^\/+/, "").trim();
  return cid ? `${PONS_IPFS}/${cid}?variant=card` : null;
}

type PonsLaunch = {
  version?: string;
  token?: string;
  deployer?: string;
  pool?: string;
  transactionHash?: string;
  blockNumber?: number;
  launchedAt?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  marketCapUsd?: number | null;
  graduated?: boolean;
  graduationProgressPct?: number | null;
};

type PonsResponse = {
  active?: { items?: PonsLaunch[] };
  graduated?: { items?: PonsLaunch[] };
};

export async function runPonsIndexer(): Promise<{ scanned: number; created: number }> {
  let created = 0;
  let scanned = 0;

  const url =
    `${PONS_API}?explore=1&sort=newest&age=${AGE}&page=1&pageSize=${PAGE_SIZE}` +
    `&graduatedPage=1&graduatedPageSize=6&includeGraduated=1&version=all`;

  let data: PonsResponse;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TheTavern/1.0; +https://x.com/TVERN_xyz)",
        accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return { scanned, created };
    data = (await res.json()) as PonsResponse;
  } catch {
    return { scanned, created };
  }

  const items = [...(data.active?.items ?? []), ...(data.graduated?.items ?? [])];

  for (const t of items) {
    if (!t.token || !t.symbol) continue;
    scanned++;

    const token = t.token.toLowerCase();
    const ts = t.launchedAt ? new Date(t.launchedAt) : new Date();
    const mcap = typeof t.marketCapUsd === "number" && isFinite(t.marketCapUsd) ? t.marketCapUsd : 0;
    const pct = typeof t.graduationProgressPct === "number" ? t.graduationProgressPct : 0;

    const nameNote = t.name && t.name.toLowerCase() !== t.symbol.toLowerCase() ? ` (${t.name})` : "";
    const mcapNote = mcap > 0 ? ` · ${formatUsd(mcap)} mcap` : "";
    const gradNote = t.graduated ? " · graduated" : pct >= 1 ? ` · ${Math.round(pct)}% to graduation` : "";
    const title = `$${t.symbol}${nameNote} just launched on Pons${mcapNote}${gradNote}`;

    const pool = t.pool && t.pool.toLowerCase() !== ZERO ? t.pool.toLowerCase() : token;
    const progress = t.graduated ? 100 : Math.max(0, Math.min(100, pct));

    try {
      await prisma.event.upsert({
        // One launch event per token, keyed the same way the GeckoTerminal ingest
        // now keys its launches so the two sources dedupe cleanly.
        where: { txHash_logIndex: { txHash: `launch:${token}`, logIndex: 0 } },
        create: {
          kind: "LAUNCH",
          txHash: `launch:${token}`,
          logIndex: 0,
          blockNumber: Number(t.blockNumber ?? 0),
          blockTs: ts,
          assetSymbol: t.symbol,
          assetAddress: token,
          fromAddr: pool,
          toAddr: (t.deployer ?? "").toLowerCase(),
          amountRaw: "0",
          amountUi: 0,
          usdValue: mcap,
          // Launches rank prominently; graduated ones higher, then a nudge by size.
          severity: (t.graduated ? 80_000 : 40_000) + Math.min(mcap, 100_000),
          title,
          imageUrl: logoUrl(t.logo),
          progressPct: progress,
        },
        // Keep the card's market cap and graduation progress live on each pass.
        update: { title, usdValue: mcap, imageUrl: logoUrl(t.logo), progressPct: progress },
      });
      created++;
    } catch {
      // dup / race
    }
  }

  return { scanned, created };
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
    // best-effort; the GeckoTerminal ingest still discovers launches on a delay
  }
}
