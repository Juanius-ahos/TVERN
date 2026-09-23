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
        fetch("/api/discover", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/users/suggested", { cache: "no-store" }).then((r) => r.json()),
      ]);
      // Never blank populated data on a transient empty response.
      if (d.trending?.length) setTrending(d.trending);
      if (d.launches?.length) setLaunches(d.launches);
      if (u.users?.length) setUsers(u.users);
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-[3.25rem] space-y-7 py-1">
      {users.length > 0 && (
        <section>
          <h3 className="display mb-2 text-[16px] font-semibold">Who to follow</h3>
          <div className="-mx-2 space-y-0.5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
                <a href={`/wallet/${u.address}`} className="flex min-w-0 items-center gap-2.5">
                  <Avatar address={u.address} src={u.avatarUrl} size={36} />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold">{u.username ?? shortAddr(u.address)}</div>
                    <div className="truncate text-[12px] text-[var(--muted)]">{u._count.followers} followers</div>
                  </div>
                </a>
                <FollowUserButton userId={u.id} initialFollowing={false} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="display mb-2 text-[16px] font-semibold">Trending</h3>
        {trending.length === 0 && <p className="text-[13px] text-[var(--muted)]">Nothing moving yet.</p>}
        <div className="-mx-2">
          {trending.map((t, i) => (
            <a
              key={t.symbol + i}
              href={`/asset/${t.symbol}`}
              className="card-hover flex items-center justify-between rounded-lg px-2 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-3.5 shrink-0 text-[12px] tabular-nums text-[var(--faint)]">{i + 1}</span>
                <span className="truncate text-[14px] font-semibold">${t.symbol}</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-[13px] tabular-nums">{fmtPrice(t.priceUsd)}</span>
                <span className="w-14 text-right text-[12px]">
                  <Pct v={t.change1h} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h3 className="display mb-2 text-[16px] font-semibold">Just launched</h3>
        {launches.length === 0 && <p className="text-[13px] text-[var(--muted)]">No fresh launches.</p>}
        <div className="-mx-2">
          {launches.map((l, i) => (
            <a
              key={l.symbol + i}
              href={`/asset/${l.symbol}`}
              className="card-hover flex items-center justify-between rounded-lg px-2 py-2"
            >
              <span className="truncate text-[14px] font-semibold">${l.symbol}</span>
              <span className="text-[12px] text-[var(--muted)] tabular-nums">
                {formatUsd(l.liquidityUsd)} · {ago(l.createdAt)}
              </span>
            </a>
          ))}
        </div>
      </section>

      <p className="text-[11.5px] leading-relaxed text-[var(--faint)]">
        Live from Robinhood Chain · not financial advice · wallet data is public.
      </p>
    </div>
  );
}
