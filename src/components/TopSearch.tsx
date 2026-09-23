"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { shortAddr } from "@/lib/format";
import type { SearchResults } from "@/app/api/search/route";

const EMPTY: SearchResults = { users: [], posts: [], assets: [] };

export function TopSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = q.trim();
    if (v.length < 1) {
      setRes(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(v)}&limit=5`, { signal: ctrl.signal });
        if (r.ok) setRes(await r.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) window.location.href = `/wallet/${v.toLowerCase()}`;
    else window.location.href = `/search?q=${encodeURIComponent(v)}`;
  }

  const has = res.users.length + res.posts.length + res.assets.length > 0;

  return (
    <div ref={boxRef} className="relative">
      <form onSubmit={go} className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <Icon name="search" size={16} />
        </span>
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search people, posts, $tickers…"
          className="w-full rounded-xl border hairline bg-[var(--panel-2)] py-2.5 pl-9 pr-3 text-[14px] outline-none transition placeholder:text-[var(--muted)] focus:border-[color:var(--accent)]/60"
        />
      </form>

      {open && q.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border hairline bg-[var(--panel)] shadow-2xl shadow-black/50">
          {!has ? (
            <div className="px-4 py-3 text-[13px] text-[var(--muted)]">
              {loading ? "Searching…" : "No matches yet."}
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-1">
              {res.assets.length > 0 && (
                <Section label="Assets">
                  {res.assets.map((a) => (
                    <a
                      key={a.symbol}
                      href={`/asset/${a.symbol}`}
                      className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.04]"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--accent)]/12 text-[13px] font-bold text-[var(--accent-text)]">
                        $
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                          ${a.symbol}
                          {a.isStock && (
                            <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-bold text-[var(--accent-text)]">
                              STOCK
                            </span>
                          )}
                        </span>
                        <span className="text-[12px] text-[var(--muted)]">
                          {a.posts > 0 ? `${a.posts} mention${a.posts === 1 ? "" : "s"}` : "on Robinhood Chain"}
                        </span>
                      </span>
                    </a>
                  ))}
                </Section>
              )}

              {res.users.length > 0 && (
                <Section label="People">
                  {res.users.map((u) => (
                    <a
                      key={u.address}
                      href={`/wallet/${u.address}`}
                      className="flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.04]"
                    >
                      <Avatar address={u.address} src={u.avatarUrl} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">
                          {u.username ?? shortAddr(u.address)}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--muted)]">
                          {u.username ? shortAddr(u.address) : "wallet"}
                          {u.followers > 0 ? ` · ${u.followers} follower${u.followers === 1 ? "" : "s"}` : ""}
                        </span>
                      </span>
                    </a>
                  ))}
                </Section>
              )}

              {res.posts.length > 0 && (
                <Section label="Posts">
                  {res.posts.map((p) => (
                    <a
                      key={p.id}
                      href={`/wallet/${p.author.address}`}
                      className="block px-4 py-2 transition hover:bg-white/[0.04]"
                    >
                      <span className="mb-0.5 flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                        <Avatar address={p.author.address} src={p.author.avatarUrl} size={16} />
                        <span className="font-semibold text-[var(--text)]">
                          {p.author.username ?? shortAddr(p.author.address)}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-[13px] text-[var(--text)]/90">{p.body}</span>
                    </a>
                  ))}
                </Section>
              )}

              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
                }}
                className="w-full border-t hairline px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--accent-text)] transition hover:bg-white/[0.04]"
              >
                See all results for “{q.trim()}”
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-4 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}
