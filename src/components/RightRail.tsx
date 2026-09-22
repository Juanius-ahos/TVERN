"use client";

import { useEffect, useState } from "react";
import { formatUsd, shortAddr } from "@/lib/format";
import { Avatar } from "./Avatar";
import { FollowUserButton } from "./FollowUserButton";

type Trending = { symbol: string; events: number; volume: number; isStock: boolean };
type Biggest = { id: string; title: string; assetSymbol: string; usdValue: number; kind: string };
type SuggestedUser = { id: string; address: string; username: string | null; avatarUrl: string | null; _count: { followers: number } };

export function RightRail() {
  const [trending, setTrending] = useState<Trending[]>([]);
  const [biggest, setBiggest] = useState<Biggest[]>([]);
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    const load = async () => {
      const [t, u] = await Promise.all([
        fetch("/api/trending").then((r) => r.json()),
        fetch("/api/users/suggested").then((r) => r.json()),
      ]);
      setTrending(t.trending ?? []);
      setBiggest(t.biggest ?? []);
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
        <h3 className="px-4 pb-2 pt-3.5 text-[17px] font-extrabold tracking-tight">Trending</h3>
        {trending.length === 0 && <p className="px-4 pb-4 text-[13px] text-[var(--muted)]">Quiet right now…</p>}
        {trending.map((t, i) => (
          <a key={t.symbol} href={`/asset/${t.symbol}`} className="card-hover flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-4 text-[13px] text-[var(--muted)]">{i + 1}</span>
              <span className="font-bold">${t.symbol}</span>
              {t.isStock && (
                <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-semibold text-[var(--accent)]">STOCK</span>
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
