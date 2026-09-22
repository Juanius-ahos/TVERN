"use client";

import { use, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { BackButton } from "@/components/BackButton";
import { useSession } from "@/lib/useSession";
import { shortAddr } from "@/lib/format";

type Msg = { id: string; body: string; mine: boolean; createdAt: string };
type Partner = { id: string; address: string; username: string | null; avatarUrl: string | null } | null;

export default function DMThreadPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { user, loading } = useSession();
  const [partner, setPartner] = useState<Partner>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !user) {
      if (!loading) setReady(true);
      return;
    }
    const load = async () => {
      try {
        const d = await fetch(`/api/messages/${address}`).then((r) => r.json());
        setPartner(d.partner ?? null);
        setMessages(d.messages ?? []);
      } catch {}
      setReady(true);
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [user, loading, address]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setErr(null);
    setText("");
    // optimistic
    const temp: Msg = { id: `tmp-${Date.now()}`, body, mine: true, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, temp]);
    try {
      const r = await fetch(`/api/messages/${address}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.message) {
        setMessages((m) => m.map((x) => (x.id === temp.id ? d.message : x)));
      } else {
        setMessages((m) => m.filter((x) => x.id !== temp.id));
        setErr(d.error ?? "could not send");
      }
    } catch {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      setErr("could not send");
    }
    setBusy(false);
  }

  const name = partner ? partner.username ?? shortAddr(partner.address) : shortAddr(address);

  return (
    <div className="flex h-[calc(100dvh-2.75rem)] flex-col">
      <header className="sticky top-11 z-20 flex items-center gap-3 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <BackButton />
        {partner && <Avatar address={partner.address} src={partner.avatarUrl} size={34} />}
        <a href={`/wallet/${address}`} className="min-w-0">
          <h1 className="truncate text-[16px] font-bold tracking-tight hover:underline">{name}</h1>
        </a>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-[var(--muted)]">Loading…</p>
        ) : !user ? (
          <p className="py-10 text-center text-[14px] text-[var(--muted)]">
            <a href="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Sign in
            </a>{" "}
            to message.
          </p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[var(--muted)]">
            No messages yet. Say hello to {name}.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] ${
                  m.mine
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border hairline bg-white/[0.04] text-[var(--text)]"
                }`}
              >
                {m.body}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {user && (
        <div className="border-t hairline px-4 py-3">
          {err && <p className="mb-2 text-[13px] text-rose-400">{err}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message…"
              rows={1}
              maxLength={2000}
              className="max-h-32 flex-1 resize-none rounded-2xl border hairline bg-[var(--panel-2)] px-3.5 py-2 text-[14px] outline-none focus:border-[color:var(--accent)]/60"
            />
            <button
              onClick={send}
              disabled={busy || !text.trim()}
              className="btn-accent rounded-full px-5 py-2 text-[14px] disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
