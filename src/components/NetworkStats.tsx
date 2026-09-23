"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Stats = {
  block: number | null;
  gasGwei: number | null;
  chainId: number;
  blockTime: string;
  events24: number;
};

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border hairline bg-[var(--panel-2)] px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--accent)]/12 text-[var(--accent-text)]">
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
        <div className="truncate text-[14px] font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

export function NetworkStats() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetch("/api/stats").then((r) => r.json());
        setS(d);
      } catch {}
    };
    load();
    const t = setInterval(load, 12_000);
    return () => clearInterval(t);
  }, []);

  const gas = s?.gasGwei != null ? (s.gasGwei < 0.01 ? "< 0.01 gwei" : `${s.gasGwei.toFixed(2)} gwei`) : "—";

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat icon="bolt" label="Latest block" value={s?.block ? s.block.toLocaleString() : "…"} />
      <Stat icon="power" label="Block time" value={s?.blockTime ?? "0.1s"} />
      <Stat icon="trending" label="Gas" value={gas} />
      <Stat icon="waves" label="Events · 24h" value={s ? s.events24.toLocaleString() : "…"} />
    </div>
  );
}
