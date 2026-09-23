/* eslint-disable @next/next/no-img-element */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="The Tavern" width={32} height={32} className="h-8 w-8" />
      {!compact && (
        <span className="display hidden text-[22px] font-semibold text-[var(--text)] lg:block">Tavern</span>
      )}
    </div>
  );
}
