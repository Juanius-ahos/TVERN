"use client";

import { useState } from "react";
import { useSession } from "@/lib/useSession";

export function CreateCommunity() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/communities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && d.slug) {
      window.location.href = `/c/${d.slug}`;
    } else {
      setErr(d.error ?? "could not create");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => (user ? setOpen(true) : (window.location.href = "/login"))}
        className="btn-accent rounded-full px-4 py-1.5 text-[14px] font-semibold"
      >
        + New community
      </button>
    );
  }

  return (
    <div className="rounded-2xl border hairline p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Community name"
        maxLength={40}
        className="w-full rounded-lg border hairline bg-transparent px-3 py-2 text-[15px] font-semibold outline-none focus:border-[color:var(--accent)]/60"
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="What's it about? (optional)"
        rows={2}
        maxLength={300}
        className="mt-2 w-full resize-none rounded-lg border hairline bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[color:var(--accent)]/60"
      />
      {err && <p className="mt-2 text-[13px] text-rose-400">{err}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-full px-4 py-1.5 text-[14px] text-[var(--muted)]">
          Cancel
        </button>
        <button
          onClick={create}
          disabled={busy || !name.trim()}
          className="btn-accent rounded-full px-5 py-1.5 text-[14px] disabled:opacity-40"
        >
          Create
        </button>
      </div>
    </div>
  );
}
