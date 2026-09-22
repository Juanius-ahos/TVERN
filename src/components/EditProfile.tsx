"use client";

import { useRef, useState } from "react";
import { useSession } from "@/lib/useSession";
import { Avatar } from "./Avatar";

export function EditProfile() {
  const { user, refresh } = useSession();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  function openModal() {
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
    setAvatarUrl(user?.avatarUrl ?? null);
    setErr(null);
    setOpen(true);
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) setAvatarUrl((await res.json()).url);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, bio, avatarUrl }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.json()).error ?? "failed");
      return;
    }
    await refresh();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-full border hairline px-4 py-1.5 text-sm font-semibold transition hover:bg-white/[0.06]"
      >
        Edit profile
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border hairline bg-[var(--bg)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">Edit profile</h2>

            <div className="mb-4 flex items-center gap-4">
              <Avatar address={user.address} src={avatarUrl} size={64} />
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full border hairline px-3 py-1.5 text-sm transition hover:bg-white/[0.06]"
              >
                Change photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </div>

            <label className="mb-1 block text-[12px] text-[var(--muted)]">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="satoshi"
              className="mb-3 w-full rounded-xl border hairline bg-[var(--panel-2)] px-3 py-2 text-[14px] outline-none focus:border-[color:var(--accent)]/60"
            />

            <label className="mb-1 block text-[12px] text-[var(--muted)]">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="degen at The Tavern"
              className="mb-3 w-full resize-none rounded-xl border hairline bg-[var(--panel-2)] px-3 py-2 text-[14px] outline-none focus:border-[color:var(--accent)]/60"
            />

            {err && <p className="mb-2 text-[12px] text-rose-400">{err}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm text-[var(--muted)]">
                Cancel
              </button>
              <button onClick={save} disabled={busy} className="btn-accent rounded-full px-5 py-2 text-sm disabled:opacity-50">
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
