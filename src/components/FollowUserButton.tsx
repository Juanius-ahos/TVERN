"use client";

import { useState } from "react";
import { useSession } from "@/lib/useSession";

export function FollowUserButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const { user } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  // hide on your own profile
  if (user && user.id === userId) return null;

  async function toggle() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    setFollowing((v) => !v);
    await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
        following
          ? "border hairline text-[var(--text)] hover:border-rose-500/50 hover:text-rose-400"
          : "btn-accent"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
