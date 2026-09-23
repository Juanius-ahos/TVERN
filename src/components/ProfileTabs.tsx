"use client";

import { useState } from "react";
import { PostCard, type FeedPost } from "./PostCard";
import { EventCard, type FeedEvent } from "./EventCard";
import { LiveTape } from "./LiveTape";
import { Icon } from "./Icon";

type TabKey = "posts" | "replies" | "media" | "activity";

export function ProfileTabs({
  posts,
  events,
  replies,
  media,
  canPost,
  postsLabel = "Posts",
  isOwn = false,
  displayName,
  postsEmpty,
  liveWallet,
}: {
  posts: FeedPost[];
  events: FeedEvent[];
  replies?: FeedPost[];
  media?: FeedPost[];
  canPost: boolean;
  postsLabel?: string;
  isOwn?: boolean;
  displayName?: string;
  postsEmpty?: { title: string; sub?: string };
  liveWallet?: string;
}) {
  const [tab, setTab] = useState<TabKey>("posts");
  const who = displayName ?? "This wallet";

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: "posts", label: postsLabel, show: true },
    { key: "replies", label: "Replies", show: replies !== undefined },
    { key: "media", label: "Media", show: media !== undefined },
    { key: "activity", label: "On-chain activity", show: true },
  ];
  const visible = tabs.filter((t) => t.show);

  function Empty({ title, sub, cta }: { title: string; sub?: string; cta?: boolean }) {
    return (
      <div className="mx-4 rounded-2xl border hairline px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[color:var(--accent)]/12 text-[var(--accent-text)]">
          <Icon name="bolt" size={20} />
        </div>
        <p className="text-[15px] font-semibold">{title}</p>
        {sub && <p className="mx-auto mt-1 max-w-xs text-[13px] text-[var(--muted)]">{sub}</p>}
        {cta && (
          <a href="/" className="btn-accent mt-4 inline-block rounded-full px-5 py-1.5 text-[14px] font-semibold">
            Write your first post
          </a>
        )}
      </div>
    );
  }

  function List({ items, empty }: { items: FeedPost[]; empty: React.ReactNode }) {
    if (items.length === 0) return <>{empty}</>;
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
        {tab === "posts" && (
          <List
            items={posts}
            empty={
              postsEmpty ? (
                <Empty title={postsEmpty.title} sub={postsEmpty.sub} />
              ) : isOwn ? (
                <Empty title="Your posts will live here" sub="Share a take, a chart, or a $ticker — pull up a stool." cta />
              ) : (
                <Empty title={`${who} hasn't posted yet`} sub="Follow them to catch it when they do." />
              )
            }
          />
        )}
        {tab === "replies" && (
          <List
            items={replies ?? []}
            empty={<Empty title={isOwn ? "You haven't replied yet" : `${who} hasn't replied yet`} />}
          />
        )}
        {tab === "media" && (
          <List
            items={media ?? []}
            empty={<Empty title={isOwn ? "No photos or videos yet" : `${who} hasn't posted media yet`} />}
          />
        )}
        {tab === "activity" &&
          (liveWallet ? (
            <div className="px-0">
              <LiveTape
                wallet={liveWallet}
                title="On-chain activity"
                emptyText="No on-chain trades indexed for this wallet yet."
              />
            </div>
          ) : events.length === 0 ? (
            <Empty
              title="No on-chain activity yet"
              sub="Buys, sells and whale moves for this wallet on Robinhood Chain will appear here."
            />
          ) : (
            events.map((e) => <EventCard key={e.id} e={e} canPost={canPost} />)
          ))}
      </div>
    </div>
  );
}
