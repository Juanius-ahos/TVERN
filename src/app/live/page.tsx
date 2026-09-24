"use client";

import { useState } from "react";
import { LiveTape } from "@/components/LiveTape";

export default function LivePage() {
  const [tab, setTab] = useState<"all" | "whales">("all");

  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[19px] font-bold tracking-tight">The Tape</h1>
        <p className="mb-2.5 text-[13px] text-[var(--muted)]">
          Every trade on Robinhood Chain, live, indexed straight from the chain.
        </p>
        <div className="flex w-full max-w-xs rounded-full border hairline bg-[var(--panel-2)] p-1 text-[14px]">
          {(["all", "whales"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-full px-3 py-1.5 font-semibold capitalize transition ${
                tab === k
                  ? "bg-[color:var(--accent)]/[0.12] text-[var(--accent-text)] ring-1 ring-[color:var(--accent)]/25"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {k === "all" ? "All trades" : "Whales · $10k+"}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {tab === "all" ? (
          <LiveTape key="all" title="Live trades" emptyText="Waiting for the next trade…" />
        ) : (
          <LiveTape key="whales" min={10000} title="Whale trades · $10k+" emptyText="No whale-sized trades just yet…" />
        )}
      </div>
    </div>
  );
}
