"use client";

import { useState } from "react";
import { useDisconnect } from "wagmi";
import { useSession } from "@/lib/useSession";
import { EditProfile } from "@/components/EditProfile";
import { Avatar } from "@/components/Avatar";
import { shortAddr } from "@/lib/format";

export default function SettingsPage() {
  const { user, loading, refresh } = useSession();
  const { disconnect } = useDisconnect();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      disconnect();
    } catch {}
    await refresh();
    window.location.href = "/";
  }

  async function deleteAccount() {
    if (!confirm("Delete your account and all your posts, follows and messages? This cannot be undone.")) return;
    setBusy(true);
    const r = await fetch("/api/account", { method: "DELETE" });
    setBusy(false);
    if (r.ok) {
      try {
        disconnect();
      } catch {}
      window.location.href = "/";
    }
  }

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Settings</h1>
      </header>

      {loading ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">Loading…</div>
      ) : !user ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          <a href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </a>{" "}
          to manage your account.
        </div>
      ) : (
        <div className="space-y-6 px-4 py-5">
          {/* Account identity */}
          <section className="rounded-2xl border hairline p-4">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Account</h2>
            <div className="flex items-center gap-3">
              <Avatar address={user.address} src={user.avatarUrl} size={48} />
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold">{user.username ?? shortAddr(user.address)}</div>
                <div className="truncate font-mono text-[12px] text-[var(--muted)]">{user.address}</div>
              </div>
              <a
                href={`/wallet/${user.address}`}
                className="ml-auto rounded-full border hairline px-4 py-1.5 text-[13px] font-semibold transition hover:bg-white/[0.06]"
              >
                View profile
              </a>
            </div>
          </section>

          {/* Profile */}
          <section className="rounded-2xl border hairline p-4">
            <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Profile</h2>
            <p className="mb-3 text-[13px] text-[var(--muted)]">Username, bio, website, photo and banner.</p>
            <EditProfile />
          </section>

          {/* Quick links */}
          <section className="overflow-hidden rounded-2xl border hairline">
            <h2 className="px-4 pb-1 pt-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Your Tavern
            </h2>
            {[
              { href: "/bookmarks", label: "Bookmarks" },
              { href: "/watchlist", label: "Watchlist" },
              { href: "/notifications", label: "Notifications" },
              { href: "/messages", label: "Messages" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex items-center justify-between px-4 py-3 text-[14px] transition hover:bg-white/[0.03]"
              >
                {l.label}
                <span className="text-[var(--muted)]">›</span>
              </a>
            ))}
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border hairline p-4">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Session</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={signOut}
                className="rounded-full border hairline px-5 py-1.5 text-[14px] font-semibold transition hover:bg-white/[0.06]"
              >
                Sign out
              </button>
              <button
                onClick={deleteAccount}
                disabled={busy}
                className="rounded-full border border-rose-500/40 px-5 py-1.5 text-[14px] font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete account"}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-[var(--muted)]">
              Deleting removes your profile, posts, follows and messages permanently.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
