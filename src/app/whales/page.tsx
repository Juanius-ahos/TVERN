import { Feed } from "@/components/Feed";

export default function WhalesPage() {
  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Whales</h1>
        <p className="text-[13px] text-[var(--muted)]">The biggest moves on Robinhood Chain — $50k+</p>
      </header>
      <div className="px-4 py-3">
        <Feed initialFilter="whale" showTabs={false} showComposer={false} />
      </div>
    </div>
  );
}
