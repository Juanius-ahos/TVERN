/* eslint-disable @next/next/no-img-element */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.svg"
        alt="The Tavern"
        width={38}
        height={38}
        className="h-[38px] w-[38px] transition-transform duration-300 hover:scale-105"
        style={{ filter: "drop-shadow(0 0 14px rgba(204,255,0,0.35))" }}
      />
      {!compact && (
        <div className="hidden leading-none lg:block">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">The</div>
          <div className="brand-gradient text-[20px] font-black tracking-tight">Tavern</div>
        </div>
      )}
    </div>
  );
}
