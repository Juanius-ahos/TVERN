"use client";

import { useEffect, useState } from "react";

type Stats = {
  block: number | null;
  gasGwei: number | null;
  chainId: number;
  ethUsd: number | null;
};

export function TopBar() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setS(await fetch("/api/stats").then((r) => r.json()));
      } catch {}
    };
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const eth = s?.ethUsd ? `$${s.ethUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "…";
  const gas = s?.gasGwei != null ? (s.gasGwei < 0.01 ? "< 0.01 gwei" : `${s.gasGwei.toFixed(2)} gwei`) : "…";
  const block = s?.block ? s.block.toLocaleString() : "…";

  return (
    <div className="sticky top-0 z-40 h-11 border-b hairline bg-[var(--bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1760px] items-center gap-5 px-4 text-[12.5px]">
        <span className="flex items-center gap-2 font-semibold">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          Robinhood Chain
        </span>
        <span className="text-[var(--muted)]">
          ETH <span className="font-semibold text-[var(--text)]">{eth}</span>
        </span>
        <span className="hidden text-[var(--muted)] sm:inline">
          Gas <span className="font-semibold text-[var(--text)]">{gas}</span>
        </span>
        <span className="hidden text-[var(--muted)] md:inline">
          Block <span className="font-semibold tabular-nums text-[var(--text)]">{block}</span>
        </span>
        <a
          href="https://robinhoodchain.blockscout.com"
          target="_blank"
          rel="noreferrer"
          className="ml-auto hidden text-[var(--muted)] transition hover:text-[var(--accent)] sm:inline"
        >
          Explorer
        </a>
      </div>
    </div>
  );
}
