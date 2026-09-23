"use client";

import { useEffect, useMemo, useState } from "react";

type Token = {
  symbol: string;
  quote: string;
  imageUrl: string | null;
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
type SortKey = "volume24" | "mcap" | "change24h" | "liquidityUsd" | "priceUsd" | "createdAt";

function fmtPrice(n: number): string {
  if (!n) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(2)}`;
}
function fmtBig(n: number): string {
  if (!n) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function age(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState({ tokens: 0, volume24: 0, liquidity: 0 });
  const [sort, setSort] = useState<SortKey>("volume24");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "stock" | "new">("all");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await fetch("/api/tokens", { cache: "no-store" }).then((r) => r.json());
        if (!alive) return;
        if (d.tokens?.length) {
          setTokens(d.tokens);
          setStats(d.stats);
        }
      } catch {}
    };
    load();
    const t = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const rows = useMemo(() => {
    let r = tokens;
    if (filter === "stock") r = r.filter((t) => t.isStock);
    if (filter === "new") r = r.filter((t) => t.createdAt);
    if (q) r = r.filter((t) => t.symbol.toLowerCase().includes(q.toLowerCase()));
    const dir = asc ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = sort === "createdAt" ? new Date(a.createdAt ?? 0).getTime() : (a[sort] as number);
      const bv = sort === "createdAt" ? new Date(b.createdAt ?? 0).getTime() : (b[sort] as number);
      return (av - bv) * dir;
    });
  }, [tokens, sort, asc, q, filter]);

  function Th({ k, label, right = true }: { k: SortKey; label: string; right?: boolean }) {
    const on = sort === k;
    return (
      <th
        onClick={() => (on ? setAsc((v) => !v) : (setSort(k), setAsc(false)))}
        className={`cursor-pointer select-none px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition hover:text-[var(--text)] ${
          right ? "text-right" : "text-left"
        } ${on ? "text-[var(--accent-text)]" : "text-[var(--muted)]"}`}
      >
        {label}
        {on ? (asc ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[19px] font-bold tracking-tight">Tokens</h1>
        <p className="mb-3 text-[13px] text-[var(--muted)]">Every token on Robinhood Chain — live market screener</p>

        {/* stat strip */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: "Tokens", value: stats.tokens || "—" },
            { label: "24h Volume", value: fmtBig(stats.volume24) },
            { label: "Liquidity", value: fmtBig(stats.liquidity) },
          ].map((s) => (
            <div key={s.label} className="surface rounded-xl px-3 py-2">
              <div className="text-[10.5px] uppercase tracking-wide text-[var(--muted)]">{s.label}</div>
              <div className="text-[16px] font-bold tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter $ticker…"
            className="w-40 rounded-full border hairline bg-[var(--panel-2)] px-3 py-1.5 text-[13px] outline-none focus:border-[color:var(--accent)]/60"
          />
          <div className="flex rounded-full border hairline bg-[var(--panel-2)] p-1 text-[13px]">
            {(["all", "stock", "new"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
                  filter === k ? "bg-[color:var(--accent)]/[0.12] text-[var(--accent-text)]" : "text-[var(--muted)]"
                }`}
              >
                {k === "all" ? "All" : k === "stock" ? "Stocks" : "New"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="overflow-x-auto px-4 py-3">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Token
              </th>
              <Th k="priceUsd" label="Price" />
              <Th k="change24h" label="24h" />
              <Th k="mcap" label="Mkt Cap" />
              <Th k="volume24" label="Vol 24h" />
              <Th k="liquidityUsd" label="Liq" />
              <Th k="createdAt" label="Age" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-[13px] text-[var(--muted)]">
                  Loading the market…
                </td>
              </tr>
            ) : (
              rows.map((t, i) => (
                <tr key={t.symbol + i} className="group">
                  <td className="border-b border-white/[0.04] px-3 py-2.5">
                    <a href={`/asset/${t.symbol}`} className="flex items-center gap-2">
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt={`${t.symbol} logo`}
                          className="h-7 w-7 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--accent)]/12 text-[11px] font-bold text-[var(--accent-text)]">
                          {t.symbol.slice(0, 2)}
                        </span>
                      )}
                      <span className="font-bold group-hover:text-[var(--accent-text)]">${t.symbol}</span>
                      {t.isStock && (
                        <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[9px] font-bold text-[var(--accent-text)]">
                          STOCK
                        </span>
                      )}
                    </a>
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-right font-semibold tabular-nums">
                    {fmtPrice(t.priceUsd)}
                  </td>
                  <td
                    className={`border-b border-white/[0.04] px-3 py-2.5 text-right font-semibold tabular-nums ${
                      t.change24h > 0 ? "text-emerald-400" : t.change24h < 0 ? "text-rose-400" : "text-[var(--muted)]"
                    }`}
                  >
                    {t.change24h ? `${t.change24h > 0 ? "+" : ""}${t.change24h.toFixed(1)}%` : "—"}
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-right tabular-nums">{fmtBig(t.mcap)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-right tabular-nums">{fmtBig(t.volume24)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-right tabular-nums text-[var(--muted)]">
                    {fmtBig(t.liquidityUsd)}
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 text-right text-[13px] text-[var(--muted)]">
                    {age(t.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
