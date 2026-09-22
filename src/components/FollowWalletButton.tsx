"use client";

import { useState } from "react";
import { useSession } from "@/lib/useSession";

export function FollowWalletButton({ address }: { address: string }) {
  const { user } = useSession();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function toggle() {
    setBusy(true);
    setFollowing((v) => !v);
    await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address }),
    });
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
        following
          ? "border border-neutral-700 text-neutral-300"
          : "bg-emerald-500 text-black hover:bg-emerald-400"
      }`}
    >
      {following ? "Following" : "Follow wallet"}
    </button>
  );
}
