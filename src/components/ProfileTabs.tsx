"use client";

import { useState } from "react";
import { PostCard, type FeedPost } from "./PostCard";
import { EventCard, type FeedEvent } from "./EventCard";

export function ProfileTabs({
  posts,
  events,
  canPost,
}: {
  posts: FeedPost[];
  events: FeedEvent[];
  canPost: boolean;
}) {
  const [tab, setTab] = useState<"posts" | "activity">("posts");

  const tabs: { key: "posts" | "activity"; label: string; n: number }[] = [
    { key: "posts", label: "Posts", n: posts.length },
    { key: "activity", label: "On-chain activity", n: events.length },
  ];

  return (
    <div>
      <div className="sticky top-11 z-10 flex border-b hairline bg-[var(--bg)]/85 backdrop-blur-xl">
        {tabs.map((t) => (
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
        {tab === "posts" ? (
          posts.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[var(--muted)]">No posts yet.</div>
          ) : (
            posts.map((p) => <PostCard key={p.id} p={p} canPost={canPost} />)
          )
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[var(--muted)]">No on-chain activity indexed yet.</div>
        ) : (
          events.map((e) => <EventCard key={e.id} e={e} canPost={canPost} />)
        )}
      </div>
    </div>
  );
}
