"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-2xl border hairline bg-[var(--surface)]">
        <Icon name="waves" className="h-9 w-9 text-[var(--muted)]" />
      </div>
      <h1 className="display text-[28px] font-semibold tracking-tight">Nothing brewing here</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">
        This page isn&apos;t on the wall yet. The chain keeps moving, check the live tape instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-accent rounded-full px-5 py-2 text-[14px] font-semibold">
          Back to the bar
        </Link>
        <Link href="/tokens" className="btn-ghost rounded-full px-5 py-2 text-[14px] font-semibold">
          Browse markets
        </Link>
      </div>
    </div>
  );
}