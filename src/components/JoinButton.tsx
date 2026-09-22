"use client";

import { useState } from "react";
import { useSession } from "@/lib/useSession";

export function JoinButton({ slug, initialJoined }: { slug: string; initialJoined: boolean }) {
  const { user } = useSession();
  const [joined, setJoined] = useState(initialJoined);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    const r = await fetch(`/api/communities/${slug}/join`, { method: "POST" });
    setBusy(false);
    if (r.ok) {
      const d = await r.json();
      setJoined(d.joined);
      // Reload so the member-only composer appears / disappears.
      location.reload();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-5 py-1.5 text-[14px] font-semibold transition ${
        joined
          ? "border hairline text-[var(--text)] hover:border-rose-500/50 hover:text-rose-400"
          : "btn-accent"
      }`}
    >
      {joined ? "Joined" : "Join"}
    </button>
  );
}
