"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { Icon } from "./Icon";
import { TVRN_ADDRESS, TVRN_SYMBOL } from "@/lib/tvrn";

const TVRN = TVRN_ADDRESS as `0x${string}`;
const SYMBOL = TVRN_SYMBOL;

const erc20Transfer = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const QUICK = [100, 500, 1000];

export function TipButton({ recipient }: { recipient: string }) {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [status, setStatus] = useState<string | null>(null);

  const live = !!TVRN;

  async function tip() {
    if (!live || !recipient) return;
    setStatus(null);
    try {
      await writeContractAsync({
        address: TVRN as `0x${string}`,
        abi: erc20Transfer,
        functionName: "transfer",
        args: [recipient as `0x${string}`, parseUnits(amount || "0", 18)],
      });
      setStatus("Tip sent 🍻");
      setTimeout(() => setOpen(false), 1200);
    } catch (e) {
      setStatus(e instanceof Error ? e.message.slice(0, 80) : "failed");
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[var(--muted)] transition hover:text-[var(--accent-text)]"
        title={live ? `Tip ${SYMBOL}` : "Tipping when $TVERN launches"}
      >
        <Icon name="bolt" size={16} />
        Tip
      </button>

      {open && (
        <div className="absolute bottom-7 left-0 z-30 w-56 rounded-xl border hairline bg-[var(--panel)] p-3 shadow-xl backdrop-blur-xl">
          {!live ? (
            <p className="text-[12.5px] text-[var(--muted)]">
              Tipping when <span className="text-[var(--accent-text)]">$TVERN</span> launches.
            </p>
          ) : !isConnected ? (
            <p className="text-[12.5px] text-[var(--muted)]">Connect your wallet to tip.</p>
          ) : (
            <>
              <div className="mb-2 flex gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`flex-1 rounded-lg border hairline px-1 py-1 text-[12px] ${
                      amount === String(q) ? "bg-white/[0.08] text-white" : "text-[var(--muted)]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full rounded-lg border hairline bg-black/30 px-2 py-1.5 text-[13px] outline-none"
                />
                <span className="text-[12px] text-[var(--muted)]">{SYMBOL}</span>
              </div>
              <button
                onClick={tip}
                disabled={isPending}
                className="btn-accent mt-2 w-full rounded-lg py-1.5 text-[13px] disabled:opacity-50"
              >
                {isPending ? "Confirm in wallet…" : `Send ${SYMBOL}`}
              </button>
            </>
          )}
          {status && <p className="mt-1.5 text-[11px] text-[var(--muted)]">{status}</p>}
        </div>
      )}
    </div>
  );
}
