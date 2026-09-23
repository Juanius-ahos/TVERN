import { LiveTape } from "@/components/LiveTape";

export default function WhalesPage() {
  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[19px] font-bold tracking-tight">Whales</h1>
        <p className="text-[13px] text-[var(--muted)]">The biggest moves on Robinhood Chain — live, $10k+</p>
      </header>
      <div className="px-4 py-4">
        <LiveTape min={10000} title="Whale trades · $10k+" emptyText="No whale-sized trades just yet…" />
      </div>
    </div>
  );
}
