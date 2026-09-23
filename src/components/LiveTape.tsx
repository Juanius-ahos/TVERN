"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddr, timeAgo } from "@/lib/format";

type Tick = {
  id: string;
  kind: string;
  symbol: string;
  wallet: string;
  usd: number;
  txHash: string;
  ts: string;
  title: string;
};

function fmtUsd(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function LiveTape({
  min = 0,
  wallet,
  title = "Live tape",
  compact = false,
  emptyText = "Waiting for the next trade…",
  bare = false,
  hideHeader = false,
}: {
  min?: number;
  wallet?: string;
  title?: string;
  compact?: boolean;
  emptyText?: string;
  bare?: boolean;
  hideHeader?: boolean;
}) {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams();
    if (min) qs.set("min", String(min));
    if (wallet) qs.set("wallet", wallet);
    const url = `/api/tape${qs.toString() ? `?${qs}` : ""}`;

    const load = async () => {
      try {
        const d = await fetch(url, { cache: "no-store" }).then((r) => r.json());
        if (!alive) return;
        const list: Tick[] = d.trades ?? [];
        if (list.length) {
          const newIds = new Set<string>();
          for (const t of list) if (!seen.current.has(t.id)) newIds.add(t.id);
          list.forEach((t) => seen.current.add(t.id));
          setTicks(list);
          if (newIds.size && ready) {
            setFresh(newIds);
            setTimeout(() => alive && setFresh(new Set()), 1400);
          }
        }
      } catch {}
      if (alive) setReady(true);
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, wallet]);

  return (
    <div className={bare ? "" : "overflow-hidden rounded-2xl border hairline"}>
      {!hideHeader && (
        <div className="flex items-center justify-between border-b hairline px-4 py-3">
          <h2 className="mono flex items-center gap-2 text-[var(--text)]">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
            {title}
          </h2>
          <span className="mono">Robinhood Chain</span>
        </div>
      )}

      <div className={compact ? "max-h-[360px] overflow-y-auto" : "max-h-[70vh] overflow-y-auto"}>
        {!ready ? (
          <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">Loading…</p>
        ) : ticks.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">{emptyText}</p>
        ) : (
          ticks.map((t) => {
            const isFresh = fresh.has(t.id);
            const buy = t.kind === "BUY" || t.kind === "WHALE";
            const flash = buy ? "bg-[color:var(--up)]/8" : "bg-[color:var(--down)]/8";
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[13px] transition-colors duration-1000 last:border-0 ${
                  isFresh ? flash : ""
                }`}
              >
                <span
                  className={`mono w-11 shrink-0 ${buy ? "text-[var(--up)]" : "text-[var(--down)]"}`}
                >
                  {t.kind === "WHALE" ? "Whale" : buy ? "Buy" : "Sell"}
                </span>
                <a href={`/asset/${t.symbol}`} className="shrink-0 font-semibold hover:underline">
                  ${t.symbol}
                </a>
                <span className="shrink-0 tabular-nums">{fmtUsd(t.usd)}</span>
                <a
                  href={`/wallet/${t.wallet}`}
                  className="ml-auto hidden font-mono text-[12px] text-[var(--muted)] hover:text-[var(--text)] sm:block"
                >
                  {shortAddr(t.wallet)}
                </a>
                <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-[var(--muted)]">{timeAgo(t.ts)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
