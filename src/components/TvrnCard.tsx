"use client";

import { ContractAddress } from "./ContractAddress";
import { TVRN_ADDRESS, TVRN_SYMBOL, TVRN_LINKS } from "@/lib/tvrn";

/** The house-token card for the right rail: CA (copy) + buy/chart links. */
export function TvrnCard() {
  if (!TVRN_ADDRESS) return null;
  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--accent)]/15 text-[16px]">🍺</span>
        <div className="leading-tight">
          <div className="text-[14px] font-bold">${TVRN_SYMBOL}</div>
          <div className="text-[11px] text-[var(--muted)]">The house token</div>
        </div>
        <a
          href={TVRN_LINKS.asset}
          className="ml-auto text-[12px] font-semibold text-[var(--accent-text)] transition hover:underline"
        >
          Chart →
        </a>
      </div>

      <div className="mt-3">
        <ContractAddress address={TVRN_ADDRESS} className="w-full" />
      </div>

      <div className="mt-2.5 flex gap-2">
        <a href={TVRN_LINKS.asset} className="btn-accent flex-1 rounded-lg py-2 text-center text-[13px] font-semibold">
          Buy ${TVRN_SYMBOL}
        </a>
        <a
          href={TVRN_LINKS.dexscreener}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost flex-1 rounded-lg py-2 text-center text-[13px] font-semibold"
        >
          DexScreener
        </a>
      </div>
    </div>
  );
}
