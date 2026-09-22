"use client";

import { useState } from "react";
import { PostCard, type FeedPost } from "./PostCard";
import { EventCard, type FeedEvent } from "./EventCard";

type TabKey = "posts" | "replies" | "media" | "activity";

export function ProfileTabs({
  posts,
  events,
  replies,
  media,
  canPost,
  postsLabel = "Posts",
}: {
  posts: FeedPost[];
  events: FeedEvent[];
  replies?: FeedPost[];
  media?: FeedPost[];
  canPost: boolean;
  postsLabel?: string;
}) {
  const [tab, setTab] = useState<TabKey>("posts");

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "posts", label: postsLabel, show: true },
    { key: "replies", label: "Replies", show: replies !== undefined },
    { key: "media", label: "Media", show: media !== undefined },
    { key: "activity", label: "On-chain activity", show: true },
  ];
  const visible = tabs.filter((t) => t.show);

  function List({ items, empty }: { items: FeedPost[]; empty: string }) {
    if (items.length === 0)
      return <div className="py-12 text-center text-[14px] text-[var(--muted)]">{empty}</div>;
    return (
      <div className="space-y-3">
        {items.map((p) => (
          <PostCard key={p.id} p={p} canPost={canPost} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-11 z-10 flex border-b hairline bg-[var(--bg)]/85 backdrop-blur-xl">
        {visible.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex-1 px-3 py-3 text-[14px] font-semibold transition hover:bg-white/[0.03] ${
              tab === t.key ? "text-[var(--text)]" : "text-[var(--muted)]"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-0 bottom-0 mx-auto h-1 w-14 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3 py-3">
        {tab === "posts" && <List items={posts} empty="No posts yet." />}
        {tab === "replies" && <List items={replies ?? []} empty="No replies yet." />}
        {tab === "media" && <List items={media ?? []} empty="No media yet." />}
        {tab === "activity" &&
          (events.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[var(--muted)]">No on-chain activity indexed yet.</div>
          ) : (
            events.map((e) => <EventCard key={e.id} e={e} canPost={canPost} />)
          ))}
      </div>
    </div>
  );
}
