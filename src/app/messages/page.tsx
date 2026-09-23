"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/lib/useSession";
import { shortAddr, timeAgo } from "@/lib/format";

type Convo = {
  partner: { id: string; address: string; username: string | null; avatarUrl: string | null };
  lastBody: string;
  lastAt: string;
  unread: number;
};

export default function MessagesPage() {
  const { user, loading } = useSession();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    const load = async () => {
      try {
        const d = await fetch("/api/messages").then((r) => r.json());
        setConvos(d.conversations ?? []);
      } catch {}
      setReady(true);
    };
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [user, loading]);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Messages</h1>
      </header>

      {!ready ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">Loading…</div>
      ) : !user ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          <a href="/login" className="font-semibold text-[var(--accent-text)] hover:underline">
            Sign in
          </a>{" "}
          to send and read messages.
        </div>
      ) : convos.length === 0 ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          No messages yet. Open anyone&apos;s profile and hit Message to start.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {convos.map((c) => (
            <a
              key={c.partner.id}
              href={`/messages/${c.partner.address}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
            >
              <Avatar address={c.partner.address} src={c.partner.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-bold">
                    {c.partner.username ?? shortAddr(c.partner.address)}
                  </span>
                  <span className="ml-auto shrink-0 text-[12px] text-[var(--muted)]">{timeAgo(c.lastAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`truncate text-[13px] ${c.unread ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"}`}>
                    {c.lastBody}
                  </span>
                  {c.unread > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-[11px] font-bold text-[var(--accent-ink)]">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
