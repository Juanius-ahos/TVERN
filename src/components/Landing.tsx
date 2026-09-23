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
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b hairline">
        {/* brand image (dark theme only — the dark photo would clash with light parchment) */}
        <div
          className="hero-img pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-tavern.jpg)" }}
        />
        {/* readability scrim — solid on the left where the text sits, revealing the bar on the right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 82%, transparent) 40%, transparent 78%), linear-gradient(0deg, var(--bg) 2%, transparent 40%)",
          }}
        />

        <div className="relative px-6 py-20 sm:px-10 sm:py-28">
          <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border hairline bg-[color:var(--bg)]/40 px-3 py-1 text-[12px] font-medium text-[var(--muted)] backdrop-blur">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Live on Robinhood Chain
          </div>

          <h1 className="display text-[42px] font-semibold leading-[1.05] tracking-tight sm:text-[64px]">
            Where the chain
            <br />
            gathers.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--muted)]">
            The Tavern is the live market and community for Robinhood Chain. Every token, every trade, and every
            conversation — in one place, in real time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="/login" className="btn-accent rounded-full px-6 py-2.5 text-[15px] font-semibold">
              Connect wallet
            </a>
            <a href="/explore" className="btn-ghost rounded-full px-6 py-2.5 text-[15px] font-semibold">
              Explore the chain
            </a>
          </div>

          {stats && (
            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Stat value={String(stats.tokens)} label="Tokens tracked" />
              <Divider />
              <Stat value={fmtBig(stats.volume24)} label="24h volume" />
              <Divider />
              <Stat value="Live" label="Trade tape" accent />
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Live proof */}
      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-[22px] font-semibold">Happening right now</h2>
            <a href="/explore" className="text-[13px] text-[var(--muted)] hover:text-[var(--text)]">
              View all →
            </a>
          </div>
          <LiveTape title="Live trades" emptyText="Listening to the chain…" compact />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div
        className={`text-[30px] font-semibold leading-none tabular-nums ${
          accent ? "text-[var(--accent-text)]" : "text-[var(--text)]"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.13em] text-[var(--faint)]">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-9 w-px bg-[var(--border)] sm:block" />;
}
