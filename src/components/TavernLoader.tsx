"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

const LINES = [
  "Pouring the latest…",
  "Rounding up the whales…",
  "Tapping fresh launches…",
  "Reading the order flow…",
  "Polishing the bar…",
  "Counting the house…",
];

export function TavernLoader({ label, full = false }: { label?: string; full?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (label) return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 1400);
    return () => clearInterval(t);
  }, [label]);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${
        full ? "min-h-[calc(100dvh-6rem)]" : "py-20"
      }`}
    >
      <div className="relative grid place-items-center">
        <span className="absolute h-20 w-20 rounded-full bg-[color:var(--accent)]/15 blur-xl" />
        <img
          src="/logo.svg"
          alt=""
          width={56}
          height={56}
          className="breathe relative h-14 w-14"
          style={{ filter: "drop-shadow(0 0 18px rgba(204,255,0,0.5))" }}
        />
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="loader-bar h-full w-1/2 rounded-full bg-[var(--accent)]" />
      </div>
      <p className="text-[13px] font-medium tracking-tight text-[var(--muted)]">{label ?? LINES[i]}</p>
    </div>
  );
}
