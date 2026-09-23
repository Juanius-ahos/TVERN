"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { buildSiweMessage } from "@/lib/siwe";
import { useSession } from "@/lib/useSession";
import { shortAddr } from "@/lib/format";
import { Icon } from "./Icon";

export function LoginPanel() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // De-dupe connectors by name (EIP-6963 can surface duplicates).
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
        chainId: chainId || 1,
      });
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Sign-in failed");
      await refresh();
      router.push("/");
      router.refresh();
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Sign-in failed";
      setErr(m.toLowerCase().includes("reject") ? "Signature cancelled." : m);
    } finally {
      setBusy(false);
    }
  }

  const safety = (
    <p className="mt-5 text-[12.5px] leading-relaxed text-[var(--faint)]">
      Signing in is a <span className="text-[var(--muted)]">message signature</span>, not a transaction — it costs no
      gas and can&apos;t move or approve your funds. We never see your keys.
    </p>
  );

  return (
    <div className="w-full max-w-[380px]">
      {user ? (
        <div>
          <h2 className="display text-[26px] font-semibold">You&apos;re in.</h2>
          <p className="mt-1.5 text-[14px] text-[var(--muted)]">
            Signed in as{" "}
            <span className="font-medium text-[var(--text)]">{user.username ?? shortAddr(user.address)}</span>.
          </p>
          <button onClick={() => router.push("/")} className="btn-accent mt-6 w-full rounded-full py-3 text-[15px]">
            Enter
          </button>
        </div>
      ) : !isConnected ? (
        <div>
          <h2 className="display text-[26px] font-semibold">Sign in</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
            Connect an EVM wallet to continue. New here? Your profile is created the moment you sign in.
          </p>

          <div className="mt-6 space-y-2">
            {wallets.length === 0 && (
              <div className="rounded-xl border hairline p-3 text-[13px] text-[var(--muted)]">
                No wallet detected. Install{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-text)] hover:underline"
                >
                  MetaMask
                </a>{" "}
                (or Rabby, Coinbase Wallet) and refresh.
              </div>
            )}
            {wallets.map((c) => (
              <button
                key={c.uid}
                onClick={() => connect({ connector: c })}
                disabled={connecting}
                className="flex w-full items-center gap-3 rounded-xl border hairline bg-[var(--surface)] px-4 py-3 text-[15px] font-medium transition hover:border-[color:var(--border-strong)] disabled:opacity-50"
              >
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon} alt="" className="h-6 w-6 rounded-md" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--muted)]">
                    <Icon name="user" size={13} />
                  </span>
                )}
                <span>{c.name}</span>
                <span className="ml-auto text-[var(--faint)]">→</span>
              </button>
            ))}
          </div>
          {safety}
        </div>
      ) : (
        <div>
          <h2 className="display text-[26px] font-semibold">One signature</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
            Connected as <span className="font-mono text-[var(--text)]">{shortAddr(address ?? "")}</span>. Sign to
            confirm it&apos;s you — free and safe.
          </p>

          <button
            onClick={signIn}
            disabled={busy}
            className="btn-accent mt-6 w-full rounded-full py-3 text-[15px] disabled:opacity-50"
          >
            {busy ? "Check your wallet…" : "Sign in"}
          </button>
          {err && <p className="mt-2.5 text-center text-[13px] text-[var(--down)]">{err}</p>}
          <button
            onClick={() => disconnect()}
            className="mt-3 block w-full text-center text-[13px] text-[var(--muted)] hover:text-[var(--text)]"
          >
            Use a different wallet
          </button>
          {safety}
        </div>
      )}
    </div>
  );
}
