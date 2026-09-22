"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { EventCard, type FeedEvent } from "./EventCard";
import { PostCard, type FeedPost } from "./PostCard";
import { PostComposer } from "./PostComposer";

type Item = FeedEvent | FeedPost;
type Filter = "" | "launch" | "whale" | "stock";

const TABS: { key: Filter; label: string }[] = [
  { key: "", label: "Latest" },
  { key: "launch", label: "Launches" },
  { key: "whale", label: "Whales" },
  { key: "stock", label: "Stocks" },
];

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border hairline p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-28 rounded bg-white/[0.06]" />
          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export function Feed({
  initialFilter = "",
  showTabs = true,
  showComposer = true,
}: {
  initialFilter?: Filter;
  showTabs?: boolean;
  showComposer?: boolean;
}) {
  const { user } = useSession();
  const canPost = !!user;
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const qs = filter ? `?filter=${filter}` : "";
    const res = await fetch(`/api/feed${qs}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div>
      {showTabs && (
        <div className="mb-3 flex rounded-full border hairline p-1 text-[14px]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition ${
                filter === t.key ? "bg-white/[0.08] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {showComposer && filter === "" && canPost && <PostComposer onPosted={load} />}
        {showComposer && filter === "" && !canPost && (
          <div className="rounded-2xl border hairline p-4 text-[14px] text-[var(--muted)]">
            Pull up a stool — connect your wallet to post, reply, and follow wallets. Browsing is free.
          </div>
        )}

        {loading && (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border hairline py-12 text-center text-[14px] text-[var(--muted)]">
            {filter === "stock"
              ? "No tokenized-stock moves yet. Stock volume is quiet — check back."
              : filter === "launch"
              ? "No new launches indexed yet — refreshing from the chain."
              : "Nothing here yet."}
          </div>
        )}

        {!loading &&
          items.map((it) =>
            it.type === "event" ? (
              <EventCard key={`e-${it.id}`} e={it} canPost={canPost} onQuoted={load} />
            ) : (
              <PostCard key={`p-${it.id}`} p={it} canPost={canPost} />
            )
          )}
      </div>
    </div>
  );
}
