"use client";

import { useEffect, useState } from "react";
import { formatUsd, shortAddr } from "@/lib/format";
import { Avatar } from "./Avatar";
import { FollowUserButton } from "./FollowUserButton";

type Pool = {
  symbol: string;
  quote: string;
  priceUsd: number;
  volume24: number;
  liquidityUsd: number;
  change1h: number;
  change24h: number;
  createdAt: string | null;
  isStock: boolean;
};
type SuggestedUser = { id: string; address: string; username: string | null; avatarUrl: string | null; _count: { followers: number } };

function fmtPrice(n: number): string {
  if (!n) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(2)}`;
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
  if (!v) return <span className="text-[var(--muted)]">—</span>;
  const up = v > 0;
  return (
    <span className={`tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
      {up ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}

export function RightRail() {
  const [trending, setTrending] = useState<Pool[]>([]);
  const [launches, setLaunches] = useState<Pool[]>([]);
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    const load = async () => {
      const [d, u] = await Promise.all([
        fetch("/api/discover").then((r) => r.json()),
        fetch("/api/users/suggested").then((r) => r.json()),
      ]);
      setTrending(d.trending ?? []);
      setLaunches(d.launches ?? []);
      setUsers(u.users ?? []);
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-[3.75rem] space-y-4">
      {users.length > 0 && (
        <section className="overflow-hidden rounded-2xl border hairline">
          <h3 className="px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">Who to follow</h3>
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <a href={`/wallet/${u.address}`} className="flex min-w-0 items-center gap-2.5 hover:opacity-90">
                <Avatar address={u.address} src={u.avatarUrl} size={38} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold">{u.username ?? shortAddr(u.address)}</div>
                  <div className="truncate text-[12px] text-[var(--muted)]">{u._count.followers} followers</div>
                </div>
              </a>
              <FollowUserButton userId={u.id} initialFollowing={false} />
            </div>
          ))}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border hairline">
        <h3 className="px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">Trending · 1h</h3>
        {trending.length === 0 && <p className="px-4 pb-4 text-[13px] text-[var(--muted)]">Quiet right now…</p>}
        {trending.map((t, i) => (
          <a key={t.symbol + i} href={`/asset/${t.symbol}`} className="card-hover flex items-center justify-between px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 shrink-0 text-[13px] text-[var(--muted)]">{i + 1}</span>
              <span className="truncate font-bold">${t.symbol}</span>
              {t.isStock && (
                <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-semibold text-[var(--accent)]">STOCK</span>
              )}
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold tabular-nums">{fmtPrice(t.priceUsd)}</div>
              <div className="text-[11px]">
                <Pct v={t.change1h} /> <span className="text-[var(--muted)]">· {formatUsd(t.volume24)}</span>
              </div>
            </div>
          </a>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border hairline">
        <h3 className="flex items-center gap-1.5 px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">
          Just launched
        </h3>
        {launches.length === 0 && <p className="px-4 pb-4 text-[13px] text-[var(--muted)]">No fresh launches…</p>}
        {launches.map((l, i) => (
          <a key={l.symbol + i} href={`/asset/${l.symbol}`} className="card-hover flex items-center justify-between px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-bold">${l.symbol}</span>
              {l.quote && <span className="shrink-0 text-[11px] text-[var(--muted)]">/{l.quote}</span>}
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold tabular-nums">{formatUsd(l.liquidityUsd)}</div>
              <div className="text-[11px] text-[var(--muted)]">{ago(l.createdAt)} ago · liq</div>
            </div>
          </a>
        ))}
      </section>

      <p className="px-2 text-[11px] leading-relaxed text-[var(--muted)]">
        The Tavern · live from Robinhood Chain · not financial advice · wallet data is public
      </p>
    </div>
  );
}
