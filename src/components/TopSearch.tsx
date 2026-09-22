"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function TopSearch() {
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) window.location.href = `/wallet/${v.toLowerCase()}`;
    else window.location.href = `/asset/${v.replace(/^\$/, "").toUpperCase()}`;
  }

  return (
    <form onSubmit={go} className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
        <Icon name="search" size={16} />
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search wallet address or $ticker…"
        className="w-full rounded-xl border hairline bg-[var(--panel-2)] py-2.5 pl-9 pr-3 text-[14px] outline-none transition placeholder:text-[var(--muted)] focus:border-[color:var(--accent)]/60"
      />
    </form>
  );
}
