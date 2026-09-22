"use client";

import { useEffect, useState } from "react";

type Pt = { t: number; c: number };

export function AssetChart({ symbol }: { symbol: string }) {
  const [pts, setPts] = useState<Pt[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/chart/${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        setPts(d.points ?? []);
        setLast(d.last ?? d.points?.at?.(-1)?.c ?? null);
        setChange(d.change24 ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol]);

  const W = 640;
  const H = 150;
  const pad = 6;

  let line = "";
  let area = "";
  if (pts.length > 1) {
    const cs = pts.map((p) => p.c);
    const min = Math.min(...cs);
    const max = Math.max(...cs);
    const span = max - min || 1;
    const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = (c: number) => pad + (1 - (c - min) / span) * (H - pad * 2);
    line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`).join(" ");
    area = `${line} L ${x(pts.length - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
  }

  const up = (change ?? 0) >= 0;
  const stroke = up ? "#17e08a" : "#fb7185";

  return (
    <div className="rounded-2xl border hairline p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="text-[13px] text-[var(--muted)]">Price · ${symbol}</div>
          <div className="text-2xl font-bold tabular-nums">
            {last != null ? `$${last < 1 ? last.toPrecision(4) : last.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
          </div>
        </div>
        {change != null && (
          <div className={`text-[14px] font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% <span className="text-[var(--muted)]">24h</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[150px] animate-pulse rounded-lg bg-white/[0.04]" />
      ) : pts.length > 1 ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 150 }}>
          <defs>
            <linearGradient id={`g-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#g-${symbol})`} />
          <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      ) : (
        <div className="grid h-[150px] place-items-center text-[13px] text-[var(--muted)]">
          No price data yet — this token may be too new or illiquid.
        </div>
      )}
    </div>
  );
}
