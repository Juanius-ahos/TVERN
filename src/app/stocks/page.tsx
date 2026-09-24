import { Feed } from "@/components/Feed";

export default function StocksPage() {
  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Stocks</h1>
        <p className="text-[13px] text-[var(--muted)]">Tokenized-stock activity, NVDA, TSLA, GME & friends</p>
      </header>
      <div className="px-4 py-3">
        <Feed initialFilter="stock" showTabs={false} showComposer={false} />
      </div>
    </div>
  );
}
