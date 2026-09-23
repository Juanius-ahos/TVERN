"use client";

import { useEffect, useState } from "react";

type Item = { symbol: string; priceUsd: number; change24h: number; isStock: boolean };

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(2)}`;
}

export function MarketTicker({ inline = false }: { inline?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetch("/api/market/ticker", { cache: "no-store" }).then((r) => r.json());
        if (d.items?.length) setItems(d.items); // keep last good on empty
      } catch {}
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) return null;

  const row = [...items, ...items]; // duplicate for a seamless loop

  return (
    <div className={`marquee-mask overflow-hidden ${inline ? "" : "border-b hairline bg-[var(--bg)]/95"}`}>
      <div className={`marquee-track text-[12.5px] ${inline ? "" : "py-2"}`}>
        {row.map((it, i) => (
          <a
            key={`${it.symbol}-${i}`}
            href={`/asset/${it.symbol}`}
            className="mx-4 inline-flex items-center gap-1.5 transition hover:opacity-80"
          >
            <span className="font-bold text-[var(--text)]">${it.symbol}</span>
            {it.isStock && (
              <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[9px] font-bold text-[var(--accent-text)]">
                STOCK
              </span>
            )}
            <span className="tabular-nums text-[var(--muted)]">{fmtPrice(it.priceUsd)}</span>
            {it.change24h !== 0 && (
              <span className={`tabular-nums font-semibold ${it.change24h > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {it.change24h > 0 ? "▲" : "▼"}
                {Math.abs(it.change24h).toFixed(1)}%
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
