"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="display text-[28px] font-semibold tracking-tight">Spilled the ale</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">
        Something went wrong pouring this one. Try again, the tape keeps flowing.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-accent rounded-full px-5 py-2 text-[14px] font-semibold">
          Try again
        </button>
        <Link href="/" className="btn-ghost rounded-full px-5 py-2 text-[14px] font-semibold">
          Back to the bar
        </Link>
      </div>
    </div>
  );
}