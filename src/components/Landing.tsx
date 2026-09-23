"use client";

import { useEffect, useState } from "react";
import { LiveTape } from "./LiveTape";

function fmtBig(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function Landing() {
  const [stats, setStats] = useState<{ tokens: number; volume24: number } | null>(null);

  useEffect(() => {
    fetch("/api/tokens", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.stats && setStats(d.stats))
      .catch(() => {});
  }, []);

  return (
    <div className="px-6 py-14 sm:px-10 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left — editorial */}
        <div>
          <div className="mono mb-6 flex items-center gap-2">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
            Live on Robinhood Chain
          </div>

          <h1 className="display text-[46px] font-medium leading-[1.02] tracking-tight sm:text-[60px]">
            The live market and <span className="italic">community</span> for Robinhood Chain.
          </h1>

          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--muted)]">
            Every token, every trade, and every conversation on the chain — in one place, in real time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="/login" className="btn-primary rounded-full px-6 py-2.5 text-[15px] font-medium">
              Connect wallet
            </a>
            <a href="/explore" className="btn-ghost rounded-full px-6 py-2.5 text-[15px] font-medium">
              Explore the chain
            </a>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t hairline pt-6">
            <Stat label="Tokens" value={stats ? String(stats.tokens) : "—"} />
            <Stat label="24h volume" value={stats ? fmtBig(stats.volume24) : "—"} />
            <Stat label="Trade tape" value="Live" />
          </div>
        </div>

        {/* Right — live proof card */}
        <div className="surface overflow-hidden rounded-2xl shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between border-b hairline px-4 py-3">
            <span className="mono flex items-center gap-2">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
              Live trades
            </span>
            <span className="mono">Robinhood Chain</span>
          </div>
          <LiveTape title="" compact bare hideHeader emptyText="Listening to the chain…" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono mb-1">{label}</div>
      <div className="text-[22px] font-semibold tabular-nums leading-none">{value}</div>
    </div>
  );
}
