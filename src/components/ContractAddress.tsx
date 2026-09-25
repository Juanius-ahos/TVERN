"use client";

import { useState } from "react";

/** Copy-pasteable contract address: full on desktop, truncated on mobile, one-click copy. */
export function ContractAddress({
  address,
  label = "CA",
  className = "",
}: {
  address: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy contract address"
      className={`group inline-flex items-center gap-2 rounded-lg border hairline bg-[var(--panel-2)] px-2.5 py-1.5 text-[12.5px] transition hover:border-[color:var(--accent)]/40 ${className}`}
    >
      {label && <span className="shrink-0 font-semibold text-[var(--faint)]">{label}</span>}
      <span className="hidden truncate font-mono text-[var(--text)] sm:inline">{address}</span>
      <span className="font-mono text-[var(--text)] sm:hidden">{short}</span>
      <span
        className={`ml-auto shrink-0 text-[11px] font-semibold ${
          copied ? "text-[var(--up)]" : "text-[var(--accent-text)]"
        }`}
      >
        {copied ? "Copied ✓" : "Copy"}
      </span>
    </button>
  );
}
