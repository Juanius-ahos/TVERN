/* eslint-disable @next/next/no-img-element */
import { LoginPanel } from "@/components/LoginPanel";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg)]">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-2">
        {/* Brand side */}
        <div className="relative flex flex-col justify-between border-b hairline p-8 sm:p-12 lg:border-b-0 lg:border-r">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" className="h-8 w-8" alt="" />
            <span className="display text-[22px] font-semibold text-[var(--text)]">Tavern</span>
          </a>

          <div className="py-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border hairline px-3 py-1 text-[12px] text-[var(--muted)]">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Live on Robinhood Chain
            </div>
            <h1 className="display text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[54px]">
              Where the chain gathers.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[var(--muted)]">
              The live market and community for Robinhood Chain. Your wallet is your account, no email, no password,
              nothing to remember.
            </p>
          </div>

          <p className="text-[12px] text-[var(--faint)]">Not financial advice · wallet data is public</p>
        </div>

        {/* Connect side */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <LoginPanel />
        </div>
      </div>
    </div>
  );
}
