"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { shortAddr, formatUsd, timeAgo } from "@/lib/format";

export type FeedEvent = {
  type: "event";
  id: string;
  kind: string;
  title: string;
  assetSymbol: string;
  assetAddress: string;
  fromAddr: string;
  toAddr: string;
  usdValue: number;
  txHash: string;
  createdAt: string;
  commentCount: number;
};

const kindStyle: Record<
  string,
  { label: string; icon: string; text: string; bg: string }
> = {
  WHALE: { label: "Whale", icon: "waves", text: "text-cyan-300", bg: "bg-cyan-400/10" },
  BUY: { label: "Buy", icon: "arrowUp", text: "text-emerald-300", bg: "bg-emerald-400/10" },
  SELL: { label: "Sell", icon: "arrowDown", text: "text-rose-300", bg: "bg-rose-400/10" },
  TRANSFER: { label: "Transfer", icon: "external", text: "text-neutral-300", bg: "bg-white/[0.06]" },
  LAUNCH: { label: "New launch", icon: "bolt", text: "text-[var(--accent-text)]", bg: "bg-[color:var(--accent)]/12" },
};

export function EventCard({
  e,
  canPost,
  onQuoted,
}: {
  e: FeedEvent;
  canPost: boolean;
  onQuoted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [followed, setFollowed] = useState(false);

  async function quote() {
    if (!body.trim()) return;
    setBusy(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, eventId: e.id }),
    });
    setBody("");
    setOpen(false);
    setBusy(false);
    onQuoted?.();
  }

  async function followWallet() {
    setFollowed((v) => !v);
    await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: e.fromAddr }),
    });
  }

  const k = kindStyle[e.kind] ?? kindStyle.TRANSFER;
  const isLaunch = e.kind === "LAUNCH";
  // For launches, `fromAddr` is the pool, not a wallet, key the visuals off the asset.
  const avatarSeed = isLaunch ? e.assetAddress || e.assetSymbol : e.fromAddr;

  return (
    <article className="animate-in card-hover rounded-2xl border hairline p-4">
      <div className="flex items-start gap-3">
        {isLaunch ? (
          <a href={`/asset/${e.assetSymbol}`} className="transition hover:opacity-90">
            <Avatar address={avatarSeed} size={42} />
          </a>
        ) : (
          <a href={`/wallet/${e.fromAddr}`} className="transition hover:opacity-90">
            <Avatar address={e.fromAddr} size={42} />
          </a>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px]">
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${k.text} ${k.bg}`}>
              <Icon name={k.icon} size={13} />
              {k.label}
            </span>
            <a href={`/asset/${e.assetSymbol}`} className="font-bold text-[var(--text)] hover:underline">
              ${e.assetSymbol}
            </a>
            <span className="text-[var(--muted)]">· {timeAgo(e.createdAt)}</span>
          </div>

          {isLaunch ? (
            <p className="mt-1.5 text-[15px] font-medium leading-snug text-[var(--text)]">{e.title}</p>
          ) : (
            <p className="mt-1.5 text-[15px] font-medium leading-snug text-[var(--text)]">
              <a href={`/wallet/${e.fromAddr}`} className="font-mono font-semibold hover:underline">
                {shortAddr(e.fromAddr)}
              </a>{" "}
              {e.title.replace(new RegExp(`^${shortAddr(e.fromAddr)}\\s*`), "")}
            </p>
          )}

          <div className="mt-3 flex items-center gap-6 text-[13px] text-[var(--muted)]">
            {canPost && (
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 transition hover:text-[var(--accent-text)]">
                <Icon name="comment" size={16} />
                {e.commentCount > 0 ? e.commentCount : ""}
              </button>
            )}
            {isLaunch ? (
              <a
                href={`/asset/${e.assetSymbol}`}
                className="flex items-center gap-1.5 transition hover:text-[var(--accent-text)]"
              >
                <Icon name="trending" size={16} /> View token
              </a>
            ) : (
              <>
                <button
                  onClick={followWallet}
                  className={`flex items-center gap-1.5 transition hover:text-[var(--accent-text)] ${followed ? "text-[var(--accent-text)]" : ""}`}
                >
                  <Icon name={followed ? "check" : "plus"} size={16} />
                  {followed ? "Following" : "Follow"}
                </button>
                <a
                  href={`https://robinhoodchain.blockscout.com/tx/${e.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition hover:text-[var(--accent-text)]"
                >
                  <Icon name="external" size={16} />
                </a>
              </>
            )}
          </div>

          {open && (
            <div className="mt-3 animate-in">
              <textarea
                value={body}
                onChange={(ev) => setBody(ev.target.value)}
                placeholder="what happened here?"
                className="w-full resize-none rounded-xl border hairline bg-black/40 p-3 text-[14px] outline-none transition focus:border-[var(--accent)]"
                rows={2}
                maxLength={500}
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  onClick={quote}
                  disabled={busy || !body.trim()}
                  className="btn-accent rounded-full px-4 py-1.5 text-[13px] disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
