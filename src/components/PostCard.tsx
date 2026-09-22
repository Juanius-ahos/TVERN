"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { TipButton } from "./TipButton";
import { RichText } from "@/lib/richtext";
import { shortAddr, timeAgo } from "@/lib/format";

export type FeedPost = {
  type: "post";
  id: string;
  body: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  author: { address: string; username: string | null; avatarUrl?: string | null };
  event: { id: string; title: string; assetSymbol: string; kind: string } | null;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
};

export function PostCard({ p, canPost }: { p: FeedPost; canPost: boolean }) {
  const [liked, setLiked] = useState(p.likedByMe);
  const [likes, setLikes] = useState(p.likeCount);
  const [reposted, setReposted] = useState(p.repostedByMe);
  const [reposts, setReposts] = useState(p.repostCount);

  async function like() {
    if (!canPost) return;
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
    const r = await fetch(`/api/posts/${p.id}/like`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setLiked(d.liked);
      setLikes(d.count);
    }
  }

  async function repost() {
    if (!canPost) return;
    setReposted((v) => !v);
    setReposts((n) => (reposted ? n - 1 : n + 1));
    const r = await fetch(`/api/posts/${p.id}/repost`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setReposted(d.reposted);
      setReposts(d.count);
    }
  }

  return (
    <article className="animate-in card-hover rounded-2xl border hairline p-4">
      <div className="flex items-start gap-3">
        <a href={`/wallet/${p.author.address}`} className="transition hover:opacity-90">
          <Avatar address={p.author.address} src={p.author.avatarUrl} size={40} />
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[14px]">
            <a href={`/wallet/${p.author.address}`} className="font-bold hover:underline">
              {p.author.username ?? shortAddr(p.author.address)}
            </a>
            {p.author.username && (
              <span className="font-mono text-[12px] text-[var(--muted)]">{shortAddr(p.author.address)}</span>
            )}
            <span className="text-[var(--muted)]">· {timeAgo(p.createdAt)}</span>
          </div>

          {p.body && (
            <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-normal">
              <RichText text={p.body} />
            </p>
          )}

          {p.mediaUrl && (
            <div className="mt-2 overflow-hidden rounded-xl border hairline">
              {p.mediaType === "video" ? (
                <video src={p.mediaUrl} controls className="max-h-[420px] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.mediaUrl} alt="" className="max-h-[420px] w-full object-cover" />
              )}
            </div>
          )}

          {p.event && (
            <div className="mt-2 rounded-xl border hairline bg-black/30 px-3 py-2.5 text-[14px] text-[var(--text)]">
              {p.event.title}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6 text-[13px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Icon name="comment" size={16} /> {p.replyCount}
            </span>
            <button
              onClick={repost}
              className={`flex items-center gap-1.5 transition ${reposted ? "text-emerald-400" : "hover:text-emerald-400"}`}
            >
              <Icon name="repost" size={16} /> {reposts}
            </button>
            <button
              onClick={like}
              className={`flex items-center gap-1.5 transition ${liked ? "text-rose-400" : "hover:text-rose-400"}`}
            >
              <Icon name="heart" size={16} fill={liked} /> {likes}
            </button>
            <TipButton recipient={p.author.address} />
          </div>
        </div>
      </div>
    </article>
  );
}
