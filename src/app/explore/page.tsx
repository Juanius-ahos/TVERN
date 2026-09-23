"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { shortAddr } from "@/lib/format";

type Token = {
  symbol: string;
  quote: string;
  priceUsd: number;
  volume24: number;
  liquidityUsd: number;
  change24h: number;
  createdAt: string | null;
  isStock: boolean;
};
type Poster = {
  address: string;
  username: string | null;
  avatarUrl: string | null;
  posts: number;
  followers: number;
  engagement: number;
  score: number;
};
type Tag = { symbol: string; mentions: number };

function fmtUsd(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function ago(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}
function Pct({ v }: { v: number }) {
  if (!v) return <span className="text-[var(--muted)]">-</span>;
  const up = v > 0;
  return (
    <span className={`tabular-nums font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
      {up ? "▲" : "▼"}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

function TokenRow({ t, i, right }: { t: Token; i: number; right: React.ReactNode }) {
  return (
    <a href={`/asset/${t.symbol}`} className="card-hover flex items-center justify-between px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="w-4 shrink-0 text-[13px] text-[var(--muted)]">{i + 1}</span>
        <span className="truncate font-bold">${t.symbol}</span>
        {t.isStock && (
          <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-semibold text-[var(--accent-text)]">
            STOCK
          </span>
        )}
      </div>
      <div className="text-right">{right}</div>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border hairline">
      <h2 className="border-b hairline px-4 py-3 text-[15px] font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function ExplorePage() {
  const [market, setMarket] = useState<{ gainers: Token[]; losers: Token[]; mostTraded: Token[]; launches: Token[] }>({
    gainers: [],
    losers: [],
    mostTraded: [],
    launches: [],
  });
  const [social, setSocial] = useState<{ topPosters: Poster[]; trendingTags: Tag[] }>({ topPosters: [], trendingTags: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [m, s] = await Promise.all([
          fetch("/api/explore", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/leaderboard", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (m && (m.gainers?.length || m.mostTraded?.length || m.launches?.length)) setMarket(m);
        if (s && (s.topPosters?.length || s.trendingTags?.length)) setSocial(s);
      } catch {}
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Explore</h1>
        <p className="text-[13px] text-[var(--muted)]">What&apos;s moving on Robinhood Chain, live</p>
      </header>

      <div className="space-y-4 px-4 py-4">
        {/* Trending cashtags */}
        {social.trendingTags.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Trending on The Tavern
            </h2>
            <div className="flex flex-wrap gap-2">
              {social.trendingTags.map((t) => (
                <a
                  key={t.symbol}
                  href={`/asset/${t.symbol}`}
                  className="card-hover rounded-full border hairline px-3 py-1.5 text-[14px]"
                >
                  <span className="font-bold text-[var(--accent-text)]">${t.symbol}</span>{" "}
                  <span className="text-[12px] text-[var(--muted)]">{t.mentions}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Top gainers · 24h">
            {market.gainers.length === 0 && <p className="px-4 py-3 text-[13px] text-[var(--muted)]">Loading…</p>}
            {market.gainers.map((t, i) => (
              <TokenRow key={t.symbol} t={t} i={i} right={<Pct v={t.change24h} />} />
            ))}
          </Section>

          <Section title="Most traded · 24h">
            {market.mostTraded.length === 0 && <p className="px-4 py-3 text-[13px] text-[var(--muted)]">Loading…</p>}
            {market.mostTraded.map((t, i) => (
              <TokenRow key={t.symbol} t={t} i={i} right={<span className="text-[13px] font-semibold">{fmtUsd(t.volume24)}</span>} />
            ))}
          </Section>

          <Section title="Fresh launches">
            {market.launches.length === 0 && <p className="px-4 py-3 text-[13px] text-[var(--muted)]">No fresh launches…</p>}
            {market.launches.map((t, i) => (
              <TokenRow
                key={t.symbol + i}
                t={t}
                i={i}
                right={
                  <span className="text-[12px] text-[var(--muted)]">
                    {fmtUsd(t.liquidityUsd)} · {ago(t.createdAt)} ago
                  </span>
                }
              />
            ))}
          </Section>

          <Section title="Top losers · 24h">
            {market.losers.length === 0 && <p className="px-4 py-3 text-[13px] text-[var(--muted)]">Loading…</p>}
            {market.losers.map((t, i) => (
              <TokenRow key={t.symbol} t={t} i={i} right={<Pct v={t.change24h} />} />
            ))}
          </Section>
        </div>

        {/* Top posters */}
        <Section title="Top voices this week">
          {social.topPosters.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-[var(--muted)]">Be the first, post something worth engaging with.</p>
          )}
          {social.topPosters.map((p, i) => (
            <a
              key={p.address}
              href={`/wallet/${p.address}`}
              className="card-hover flex items-center gap-3 px-4 py-2.5"
            >
              <span className="w-4 text-[13px] text-[var(--muted)]">{i + 1}</span>
              <Avatar address={p.address} src={p.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{p.username ?? shortAddr(p.address)}</div>
                <div className="text-[12px] text-[var(--muted)]">
                  {p.posts} posts · {p.engagement} engagements · {p.followers} followers
                </div>
              </div>
            </a>
          ))}
        </Section>
      </div>
    </div>
  );
}
