"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { TipButton } from "./TipButton";
import { Poll } from "./Poll";
import { PostMenu } from "./PostMenu";
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
  community?: { slug: string; name: string } | null;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  bookmarkedByMe?: boolean;
  poll?: {
    id: string;
    options: { id: string; text: string; votes: number }[];
    totalVotes: number;
    myOptionId: string | null;
  } | null;
};

export function PostCard({ p, canPost }: { p: FeedPost; canPost: boolean }) {
  const [liked, setLiked] = useState(p.likedByMe);
  const [likes, setLikes] = useState(p.likeCount);
  const [reposted, setReposted] = useState(p.repostedByMe);
  const [reposts, setReposts] = useState(p.repostCount);
  const [bookmarked, setBookmarked] = useState(!!p.bookmarkedByMe);

  async function bookmark() {
    if (!canPost) return;
    setBookmarked((v) => !v);
    const r = await fetch(`/api/posts/${p.id}/bookmark`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setBookmarked(d.bookmarked);
    }
  }

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

  // Open X's share composer pre-filled with a quote of this post + a link back.
  // Uses the web intent, so it needs no API keys and posts as the reader, not us.
  function shareToX() {
    const author = p.author.username ? `@${p.author.username}` : shortAddr(p.author.address);
    const raw = (p.body || p.event?.title || "").trim();
    const snippet = raw.length > 180 ? `${raw.slice(0, 180).trim()}…` : raw;
    const text = snippet ? `"${snippet}"\n\nby ${author} on The Tavern` : `${author} on The Tavern`;
    const url = typeof window !== "undefined" ? `${window.location.origin}/post/${p.id}` : `/post/${p.id}`;
    const intent =
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` +
      `&url=${encodeURIComponent(url)}&via=TVERN_xyz`;
    window.open(intent, "_blank", "noopener,noreferrer");
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
            <a href={`/post/${p.id}`} className="text-[var(--muted)] hover:underline">
              · {timeAgo(p.createdAt)}
            </a>
            {p.community && (
              <a
                href={`/c/${p.community.slug}`}
                className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--muted)] transition hover:text-[var(--accent-text)]"
              >
                {p.community.name}
              </a>
            )}
            <PostMenu authorAddress={p.author.address} postId={p.id} />
          </div>

          {p.body && (
            <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-normal">
              <RichText text={p.body} />
            </p>
          )}

          {p.poll && <Poll poll={p.poll} canVote={canPost} />}

          {p.mediaUrl &&
            (p.mediaType === "video" ? (
              <div className="mt-2 overflow-hidden rounded-xl border hairline bg-black/40">
                <video src={p.mediaUrl} controls className="mx-auto max-h-[520px] w-auto max-w-full" />
              </div>
            ) : (
              <a
                href={`/post/${p.id}`}
                className="mt-2 flex justify-center overflow-hidden rounded-xl border hairline bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.mediaUrl} alt="" className="max-h-[520px] w-auto max-w-full object-contain" />
              </a>
            ))}

          {p.event && (
            <div className="mt-2 rounded-xl border hairline bg-black/30 px-3 py-2.5 text-[14px] text-[var(--text)]">
              {p.event.title}
            </div>
          )}

          <div className="mt-3 flex items-center gap-6 text-[13px] text-[var(--muted)]">
            <a
              href={`/post/${p.id}`}
              className="flex items-center gap-1.5 transition hover:text-[var(--accent-text)]"
            >
              <Icon name="comment" size={16} /> {p.replyCount}
            </a>
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
            <button
              onClick={bookmark}
              className={`flex items-center gap-1.5 transition ${bookmarked ? "text-[var(--accent-text)]" : "hover:text-[var(--accent-text)]"}`}
              aria-label="Bookmark"
            >
              <Icon name="bookmark" size={16} fill={bookmarked} />
            </button>
            <button
              onClick={shareToX}
              className="flex items-center gap-1.5 transition hover:text-[var(--text)]"
              aria-label="Share to X"
              title="Share to X"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.08-6.93Zm-1.3 19.5h2.04L6.49 3.24H4.3l13.3 17.41Z" />
              </svg>
            </button>
            <TipButton recipient={p.author.address} />
          </div>
        </div>
      </div>
    </article>
  );
}
