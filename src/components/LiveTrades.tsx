"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddr, timeAgo } from "@/lib/format";

type Trade = {
  side: "buy" | "sell";
  usd: number;
  amount: number;
  wallet: string;
  txHash: string;
  ts: string;
};

function fmtUsd(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function LiveTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await fetch(`/api/trades/${symbol}`, { cache: "no-store" }).then((r) => r.json());
        if (!alive) return;
        const list: Trade[] = d.trades ?? [];
        if (list.length) {
          const newIds = new Set<string>();
          for (const t of list) {
            const id = t.txHash + t.ts;
            if (!seen.current.has(id)) newIds.add(id);
          }
          list.forEach((t) => seen.current.add(t.txHash + t.ts));
          setTrades(list);
          if (newIds.size && ready) {
            setFresh(newIds);
            setTimeout(() => alive && setFresh(new Set()), 1200);
          }
        }
      } catch {}
      if (alive) setReady(true);
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // Buy/sell pressure over the visible tape.
  const buyUsd = trades.filter((t) => t.side === "buy").reduce((s, t) => s + t.usd, 0);
  const sellUsd = trades.filter((t) => t.side === "sell").reduce((s, t) => s + t.usd, 0);
  const total = buyUsd + sellUsd;
  const buyPct = total > 0 ? Math.round((buyUsd / total) * 100) : 50;

  return (
    <div className="overflow-hidden rounded-2xl border hairline">
      <div className="flex items-center justify-between border-b hairline px-4 py-3">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight">
          <span className="live-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
          Live trades
        </h2>
        <span className="text-[12px] text-[var(--muted)]">${symbol}</span>
      </div>

      {/* Buy/sell pressure */}
      {total > 0 && (
        <div className="px-4 pb-3 pt-3">
          <div className="mb-1 flex justify-between text-[11px] font-semibold">
            <span className="text-emerald-400">Buys {fmtUsd(buyUsd)}</span>
            <span className="text-rose-400">{fmtUsd(sellUsd)} Sells</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-rose-500/30">
            <div className="h-full bg-emerald-400" style={{ width: `${buyPct}%` }} />
          </div>
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto">
        {!ready ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">Loading the tape…</p>
        ) : trades.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">No recent trades.</p>
        ) : (
          trades.map((t) => {
            const id = t.txHash + t.ts;
            const isFresh = fresh.has(id);
            const whale = t.usd >= 10000;
            return (
              <div
                key={id}
                className={`flex items-center gap-3 border-b border-white/[0.04] px-4 py-2 text-[13px] transition-colors duration-700 ${
                  isFresh ? (t.side === "buy" ? "bg-emerald-400/10" : "bg-rose-400/10") : ""
                }`}
              >
                <span
                  className={`w-9 shrink-0 font-bold ${t.side === "buy" ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {t.side === "buy" ? "BUY" : "SELL"}
                </span>
                <span className={`shrink-0 font-semibold tabular-nums ${whale ? "text-[var(--accent-text)]" : ""}`}>
                  {fmtUsd(t.usd)}
                  {whale && " *"}
                </span>
                <a
                  href={`/wallet/${t.wallet}`}
                  className="ml-auto font-mono text-[12px] text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  {shortAddr(t.wallet)}
                </a>
                <span className="w-10 shrink-0 text-right text-[11px] text-[var(--muted)]">{timeAgo(t.ts)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
