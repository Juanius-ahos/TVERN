"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/useSession";

export function PostMenu({ authorAddress }: { authorAddress: string }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Don't show the menu on your own posts.
  if (user && user.address === authorAddress) return null;

  async function act(action: "mute" | "block") {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setOpen(false);
    await fetch("/api/moderation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetAddress: authorAddress, action }),
    });
    setDone(action === "mute" ? "Muted — refresh to hide" : "Blocked — refresh to hide");
    setTimeout(() => setDone(null), 3000);
  }

  return (
    <div ref={ref} className="relative ml-auto" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-7 w-7 place-items-center rounded-full text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-[var(--text)]"
        aria-label="Post menu"
      >
        <span className="text-[18px] leading-none">···</span>
      </button>
      {done && (
        <span className="absolute right-0 top-8 z-50 whitespace-nowrap rounded-lg border hairline bg-[var(--panel)] px-2.5 py-1 text-[12px] text-[var(--muted)] shadow-lg">
          {done}
        </span>
      )}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 overflow-hidden rounded-xl border hairline bg-[var(--panel)] py-1 shadow-2xl shadow-black/50">
          <button
            onClick={() => act("mute")}
            className="block w-full px-4 py-2 text-left text-[14px] transition hover:bg-white/[0.05]"
          >
            Mute user
          </button>
          <button
            onClick={() => act("block")}
            className="block w-full px-4 py-2 text-left text-[14px] text-rose-400 transition hover:bg-white/[0.05]"
          >
            Block user
          </button>
        </div>
      )}
    </div>
  );
}
