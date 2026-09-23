"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useSession } from "@/lib/useSession";
import { shortAddr, timeAgo } from "@/lib/format";

type Notif = {
  id: string;
  type: "LIKE" | "REPOST" | "REPLY" | "FOLLOW";
  read: boolean;
  createdAt: string;
  actor: { address: string; username: string | null; avatarUrl: string | null };
  postId: string | null;
  postExcerpt: string | null;
};

const VERB: Record<Notif["type"], string> = {
  LIKE: "liked your post",
  REPOST: "reposted your post",
  REPLY: "replied to your post",
  FOLLOW: "followed you",
};
const ICON: Record<Notif["type"], string> = {
  LIKE: "heart",
  REPOST: "repost",
  REPLY: "comment",
  FOLLOW: "user",
};

export default function NotificationsPage() {
  const { user, loading } = useSession();
  const [items, setItems] = useState<Notif[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        const d = await fetch("/api/notifications").then((r) => r.json());
        setItems(d.items ?? []);
        // mark all read once viewed
        fetch("/api/notifications", { method: "POST" }).catch(() => {});
      } catch {}
      setReady(true);
    })();
  }, [user, loading]);

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Notifications</h1>
      </header>

      {!ready ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">Loading…</div>
      ) : !user ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          <a href="/login" className="font-semibold text-[var(--accent-text)] hover:underline">
            Sign in
          </a>{" "}
          to see your notifications.
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          Nothing yet. Likes, replies, reposts and new followers will show up here.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {items.map((n) => {
            const href = n.type === "FOLLOW" ? `/wallet/${n.actor.address}` : n.postId ? `/post/${n.postId}` : "#";
            const name = n.actor.username ?? shortAddr(n.actor.address);
            return (
              <a
                key={n.id}
                href={href}
                className={`flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.03] ${
                  n.read ? "" : "bg-[color:var(--accent)]/[0.05]"
                }`}
              >
                <span className="mt-1 text-[var(--accent-text)]">
                  <Icon name={ICON[n.type]} size={18} fill={n.type === "LIKE"} />
                </span>
                <Avatar address={n.actor.address} src={n.actor.avatarUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]">
                    <span className="font-bold">{name}</span>{" "}
                    <span className="text-[var(--text)]/80">{VERB[n.type]}</span>{" "}
                    <span className="text-[var(--muted)]">· {timeAgo(n.createdAt)}</span>
                  </p>
                  {n.postExcerpt && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--muted)]">{n.postExcerpt}</p>
                  )}
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
