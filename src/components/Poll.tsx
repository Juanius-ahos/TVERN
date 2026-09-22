"use client";

import { useState } from "react";

type PollData = {
  id: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  myOptionId: string | null;
};

export function Poll({ poll, canVote }: { poll: PollData; canVote: boolean }) {
  const [options, setOptions] = useState(poll.options);
  const [total, setTotal] = useState(poll.totalVotes);
  const [myOption, setMyOption] = useState(poll.myOptionId);
  const [busy, setBusy] = useState(false);

  const voted = myOption != null;
  const showResults = voted || !canVote;

  async function vote(optionId: string) {
    if (busy || voted || !canVote) return;
    setBusy(true);
    // optimistic
    setOptions((prev) => prev.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)));
    setTotal((t) => t + 1);
    setMyOption(optionId);
    try {
      const r = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (r.ok) {
        const d = await r.json();
        setOptions(d.options);
        setTotal(d.totalVotes);
        setMyOption(d.myOptionId);
      }
    } catch {}
    setBusy(false);
  }

  return (
    <div className="mt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      {options.map((o) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
        const isMine = myOption === o.id;
        return (
          <button
            key={o.id}
            onClick={() => vote(o.id)}
            disabled={!canVote || voted}
            className={`relative w-full overflow-hidden rounded-lg border hairline px-3 py-2 text-left text-[14px] transition ${
              showResults ? "cursor-default" : "hover:border-[color:var(--accent)]/50"
            }`}
          >
            {showResults && (
              <span
                className={`absolute inset-y-0 left-0 ${isMine ? "bg-[color:var(--accent)]/25" : "bg-white/[0.06]"}`}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between gap-2">
              <span className={`truncate ${isMine ? "font-semibold text-[var(--accent)]" : ""}`}>
                {o.text}
                {isMine && " ✓"}
              </span>
              {showResults && <span className="tabular-nums text-[13px] text-[var(--muted)]">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <div className="pt-0.5 text-[12px] text-[var(--muted)]">
        {total} vote{total === 1 ? "" : "s"}
        {!canVote && !voted && " · sign in to vote"}
      </div>
    </div>
  );
}
