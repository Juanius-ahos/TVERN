/* eslint-disable @next/next/no-img-element */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="The Tavern" width={34} height={34} className="h-[34px] w-[34px]" />
      {!compact && (
        <span className="hidden text-[19px] font-extrabold tracking-tight text-[var(--text)] lg:block">Tavern</span>
      )}
    </div>
  );
}
