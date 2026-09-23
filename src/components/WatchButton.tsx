"use client";

import { useState } from "react";
import { useSession } from "@/lib/useSession";
import { Icon } from "./Icon";

export function WatchButton({ symbol, initialWatching }: { symbol: string; initialWatching: boolean }) {
  const { user } = useSession();
  const [watching, setWatching] = useState(initialWatching);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    setWatching((v) => !v);
    const r = await fetch("/api/watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    if (r.ok) {
      const d = await r.json();
      setWatching(d.watching);
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-semibold transition ${
        watching
          ? "border hairline text-[var(--accent-text)] hover:border-rose-500/40 hover:text-rose-400"
          : "btn-accent"
      }`}
    >
      <Icon name="star" size={16} fill={watching} />
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
