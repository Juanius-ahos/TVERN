"use client";

import { useDisconnect } from "wagmi";
import { useSession } from "@/lib/useSession";
import { shortAddr } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export function ConnectButton() {
  const { disconnect } = useDisconnect();
  const { user, refresh } = useSession();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    await refresh();
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-full border hairline p-1.5 lg:px-2">
        <a href={`/wallet/${user.address}`} className="flex min-w-0 items-center gap-2 hover:opacity-80">
          <Avatar address={user.address} src={user.avatarUrl} size={30} />
          <span className="hidden truncate font-mono text-[13px] lg:block">
            {user.username ?? shortAddr(user.address)}
          </span>
        </a>
        <button
          onClick={signOut}
          title="Sign out"
          className="hidden shrink-0 px-1 text-[var(--muted)] transition hover:text-[var(--text)] lg:block"
        >
          <Icon name="power" size={16} />
        </button>
      </div>
    );
  }

  return (
    <a
      href="/login"
      className="btn-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px]"
    >
      <Icon name="plus" size={18} className="lg:hidden" />
      <span className="hidden lg:inline">Connect Wallet</span>
    </a>
  );
}
