"use client";

/* eslint-disable @next/next/no-img-element */

export function TavernLoader({ label, full = false }: { label?: string; full?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${
        full ? "min-h-[calc(100dvh-6rem)]" : "py-20"
      }`}
    >
      <img src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10 opacity-90" />
      <div className="h-0.5 w-32 overflow-hidden rounded-full bg-[var(--border)]">
        <div className="loader-bar h-full w-1/2 rounded-full bg-[var(--accent)]" />
      </div>
      {label && <p className="text-[13px] text-[var(--muted)]">{label}</p>}
    </div>
  );
}
