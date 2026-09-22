"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/format";

type Trending = { symbol: string; events: number; volume: number; isStock: boolean };
type Biggest = { id: string; title: string; assetSymbol: string; usdValue: number; kind: string };

export function RightRail() {
  const [trending, setTrending] = useState<Trending[]>([]);
  const [biggest, setBiggest] = useState<Biggest[]>([]);

  useEffect(() => {
    const load = async () => {
      const d = await fetch("/api/trending").then((r) => r.json());
      setTrending(d.trending ?? []);
      setBiggest(d.biggest ?? []);
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="sticky top-[3.75rem] space-y-4">
      <section className="overflow-hidden rounded-2xl border hairline">
        <h3 className="px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">Trending</h3>
        {trending.length === 0 && <p className="px-4 pb-4 text-[13px] text-[var(--muted)]">Quiet right now…</p>}
        {trending.map((t, i) => (
          <a
            key={t.symbol}
            href={`/asset/${t.symbol}`}
            className="card-hover flex items-center justify-between px-4 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-4 text-[13px] text-[var(--muted)]">{i + 1}</span>
              <span className="font-bold">${t.symbol}</span>
              {t.isStock && (
                <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-semibold text-[var(--accent)]">
                  STOCK
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold">{formatUsd(t.volume)}</div>
              <div className="text-[11px] text-[var(--muted)]">{t.events} events</div>
            </div>
          </a>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border hairline">
        <h3 className="px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">Biggest moves · 24h</h3>
        {biggest.length === 0 && <p className="px-4 pb-4 text-[13px] text-[var(--muted)]">—</p>}
        {biggest.map((b) => (
          <a key={b.id} href={`/asset/${b.assetSymbol}`} className="card-hover block px-4 py-2.5 text-[14px]">
            {b.title}
          </a>
        ))}
      </section>

      <p className="px-2 text-[11px] leading-relaxed text-[var(--muted)]">
        The Tavern · live from Robinhood Chain · not financial advice · wallet data is public
      </p>
    </div>
  );
}
