"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { buildSiweMessage } from "@/lib/siwe";
import { useSession } from "@/lib/useSession";
import { shortAddr } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    if (!address) return;
    setBusy(true);
    setErr(null);
    try {
      const nonce = (await (await fetch("/api/auth/nonce")).json()).nonce as string;
      const message = buildSiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address,
        nonce,
        issuedAt: new Date().toISOString(),
        chainId: 4663,
      });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "sign-in failed");
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    await refresh();
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-full border hairline p-1.5 lg:px-2">
        <a href={`/wallet/${user.address}`} className="flex min-w-0 items-center gap-2 hover:opacity-80">
          <Avatar address={user.address} size={30} />
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

  if (isConnected) {
    return (
      <div>
        <button
          onClick={signIn}
          disabled={busy}
          className="btn-accent w-full rounded-full px-4 py-2.5 text-[14px] disabled:opacity-50"
        >
          {busy ? "Check wallet…" : "Sign in"}
        </button>
        {err && <p className="mt-1 text-[11px] text-rose-400">{err}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="btn-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px]"
    >
      <Icon name="plus" size={18} className="lg:hidden" />
      <span className="hidden lg:inline">Connect Wallet</span>
    </button>
  );
}
