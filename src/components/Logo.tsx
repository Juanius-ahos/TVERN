/* eslint-disable @next/next/no-img-element */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.svg"
        alt="The Tavern"
        width={38}
        height={38}
        className="h-[38px] w-[38px]"
        style={{ filter: "drop-shadow(0 0 10px rgba(204,255,0,0.25))" }}
      />
      {!compact && (
        <div className="hidden leading-none lg:block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">The</div>
          <div className="text-[19px] font-black tracking-tight text-[var(--accent)]">Tavern</div>
        </div>
      )}
    </div>
  );
}
