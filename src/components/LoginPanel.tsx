"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { buildSiweMessage } from "@/lib/siwe";
import { useSession } from "@/lib/useSession";
import { shortAddr } from "@/lib/format";
import { Icon } from "./Icon";

export function LoginPanel() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // de-dupe connectors by name (EIP-6963 can surface duplicates)
  const seen = new Set<string>();
  const wallets = connectors.filter((c) => {
    const k = c.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

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
      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "sign-in failed";
      setErr(m.includes("rejected") ? "Signature cancelled." : m);
    } finally {
      setBusy(false);
    }
  }

  const Safety = (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)]">
        <Icon name="check" size={15} /> Your funds are never at risk
      </div>
      <ul className="space-y-1.5 text-[13px] leading-relaxed text-neutral-300">
        <li>· You only <b>sign a message</b> to prove the wallet is yours.</li>
        <li>· It’s a <b>signature, not a transaction</b> — costs no gas.</li>
        <li>· It <b>can’t move, spend, or approve</b> any of your tokens or ETH.</li>
        <li>· We never see your seed phrase or private keys.</li>
        <li>· Disconnect anytime.</li>
      </ul>
    </div>
  );

  return (
    <div className="w-full max-w-[420px]">
      {/* Already signed in */}
      {user ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl">
          <p className="text-[15px] text-neutral-200">
            Signed in as <span className="font-mono font-semibold text-[var(--accent)]">{user.username ?? shortAddr(user.address)}</span>
          </p>
          <button onClick={() => router.push("/")} className="btn-accent mt-4 w-full rounded-full py-3 text-[15px]">
            Enter The Tavern
          </button>
        </div>
      ) : !isConnected ? (
        /* Step 1: choose a wallet */
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          <h2 className="text-[17px] font-bold">Connect your wallet</h2>
          <p className="mt-1 text-[13px] text-neutral-400">Pick a wallet to continue. Browsing stays free.</p>

          <div className="mt-4 space-y-2">
            {wallets.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[13px] text-neutral-400">
                No wallet detected. Install{" "}
                <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                  MetaMask
                </a>{" "}
                (or Rabby / Coinbase Wallet) and refresh.
              </div>
            )}
            {wallets.map((c) => (
              <button
                key={c.uid}
                onClick={() => connect({ connector: c })}
                disabled={connecting}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] font-medium transition hover:border-[color:var(--accent)]/50 hover:bg-white/[0.06] disabled:opacity-50"
              >
                <span className="flex items-center gap-3">
                  {c.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon} alt="" className="h-6 w-6 rounded" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded bg-[color:var(--accent)]/15 text-[var(--accent)]">
                      <Icon name="bolt" size={14} />
                    </span>
                  )}
                  {c.name}
                </span>
                <span className="text-neutral-500">→</span>
              </button>
            ))}
          </div>
          {Safety}
        </div>
      ) : (
        /* Step 2: sign the message */
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
          <h2 className="text-[17px] font-bold">Prove it’s you</h2>
          <p className="mt-1 text-[13px] text-neutral-400">
            Connected as <span className="font-mono text-neutral-200">{shortAddr(address ?? "")}</span>. Sign the message below to finish — it’s free and safe.
          </p>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-neutral-400">
            Sign in to The Tavern — no transaction, no gas.
          </div>

          <button onClick={signIn} disabled={busy} className="btn-accent mt-4 w-full rounded-full py-3 text-[15px] disabled:opacity-50">
            {busy ? "Check your wallet…" : "Sign in"}
          </button>
          {err && <p className="mt-2 text-center text-[13px] text-rose-400">{err}</p>}
          <button onClick={() => disconnect()} className="mt-3 block w-full text-center text-[13px] text-neutral-500 hover:text-neutral-300">
            use a different wallet
          </button>
          {Safety}
        </div>
      )}
    </div>
  );
}
