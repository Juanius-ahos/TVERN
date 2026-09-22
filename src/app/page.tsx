import { Feed } from "@/components/Feed";
import { TopSearch } from "@/components/TopSearch";

export default function Home() {
  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <h1 className="text-[19px] font-bold tracking-tight">The Tavern</h1>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border hairline px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            LIVE
          </span>
        </div>
        <p className="mb-2.5 text-[13px] text-[var(--muted)]">Where Robinhood Chain gathers — pull up a stool.</p>
        <TopSearch />
      </header>
      <div className="px-4 py-3">
        <Feed />
      </div>
    </div>
  );
}
