"use client";

import { LiveTape } from "./LiveTape";
import { LandingBackdrop } from "./LandingBackdrop";

export function Landing() {
  return (
    <div>
      {/* Hero — coded animated backdrop (charts, posts, tickers) behind a crisp brand message */}
      <section className="relative overflow-hidden border-b hairline">
        <LandingBackdrop />

        {/* readability scrim — solid where the text sits (left), revealing the live app on the right */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 80%, transparent) 44%, transparent 76%), linear-gradient(0deg, var(--bg) 3%, transparent 42%)",
          }}
        />
        {/* subtle brand glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-28 z-[1] h-[440px] w-[440px] rounded-full"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent), transparent 62%)",
            filter: "blur(24px)",
          }}
        />

        <div className="relative z-[2] px-6 py-24 sm:px-10 sm:py-32">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border hairline bg-[color:var(--bg)]/50 px-3 py-1 text-[12px] font-medium text-[var(--muted)] backdrop-blur">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Live on Robinhood Chain
            </div>

            <h1 className="display text-[46px] font-semibold leading-[1.02] tracking-tight sm:text-[72px]">
              Where the chain
              <br />
              gathers.
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[var(--muted)] sm:text-[18px]">
              The social layer for Robinhood Chain. Every token, every trade, and every conversation — live, in one
              place. Follow the whales, react to the moves, and trade the culture.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="/login" className="btn-accent rounded-full px-7 py-3 text-[15px] font-semibold">
                Connect wallet
              </a>
              <a href="/explore" className="btn-ghost rounded-full px-7 py-3 text-[15px] font-semibold">
                Explore the chain
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Live proof — real tape from the chain */}
      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-[22px] font-semibold">Happening right now</h2>
            <a href="/explore" className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]">
              View all →
            </a>
          </div>
          <LiveTape title="Live trades" emptyText="Listening to the chain…" compact />
        </div>
      </section>
    </div>
  );
}
