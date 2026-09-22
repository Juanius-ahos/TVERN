/* eslint-disable @next/next/no-img-element */
import { LoginPanel } from "@/components/LoginPanel";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#08090b]">
      {/* lime beam */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(204,255,0,0.10), transparent 55%)" }}
      />
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(130% 100% at 50% 40%, transparent 42%, rgba(0,0,0,0.66) 100%)" }}
      />
      {/* film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
      />

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
        <a href="/" className="mb-5 flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="The Tavern"
            className="h-12 w-12"
            style={{ filter: "drop-shadow(0 0 16px rgba(204,255,0,0.35))" }}
          />
        </a>

        <h1 className="sheen-text text-center font-serif text-5xl font-normal leading-[0.98] tracking-tight sm:text-6xl">
          The Tavern
        </h1>
        <p className="mt-3 max-w-sm text-center text-[15px] leading-relaxed text-neutral-400">
          Where Robinhood Chain gathers — watch the whales, swap the alpha, pull up a stool.
        </p>

        <div className="mt-8 flex w-full justify-center">
          <LoginPanel />
        </div>

        <p className="mt-8 text-[12px] text-neutral-600">Not financial advice · your wallet data is public on-chain</p>
      </div>
    </div>
  );
}
