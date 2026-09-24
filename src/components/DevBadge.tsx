// The dev/moderator badge. Small lime pill shown next to a dev's name.
export function DevBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Tavern dev"
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-1.5 py-[1px] text-[10px] font-bold uppercase leading-none tracking-wide text-[var(--accent-ink)] ${className}`}
    >
      <svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true">
        <path d="M8.7 7.3 4 12l4.7 4.7 1.4-1.4L6.8 12l3.3-3.3zM15.3 7.3 13.9 8.7 17.2 12l-3.3 3.3 1.4 1.4L20 12z" />
      </svg>
      Dev
    </span>
  );
}
