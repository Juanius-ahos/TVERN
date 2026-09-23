export const metadata = { title: "Docs — The Tavern" };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-2 text-[20px] font-extrabold tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--text)]/85">{children}</div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[19px] font-bold tracking-tight">Docs</h1>
        <p className="text-[13px] text-[var(--muted)]">What The Tavern is, and how it works under the hood</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
        <div>
          <h2 className="brand-gradient text-[28px] font-black tracking-tight">The Tavern</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-[var(--text)]/85">
            The social layer and live market terminal for Robinhood Chain. Watch the whales, read the tape, discuss
            every token — all in one place, all in real time.
          </p>
        </div>

        <Section id="what" title="What it is">
          <p>
            The Tavern is where Robinhood Chain gathers. It fuses a social network with a live market terminal: post
            and reply like a feed, but every <span className="font-semibold text-[var(--accent-text)]">$ticker</span> links
            to a live asset page with price, market cap, a chart, and a streaming trade tape.
          </p>
          <p>
            It is scoped entirely to Robinhood Chain — no global crypto noise. Tokenized stocks (NVDA, TSLA, SPY),
            memecoins, and fresh launches, all native to the chain.
          </p>
        </Section>

        <Section id="live" title="Live data engine">
          <p>The Tavern reads Robinhood Chain two independent ways, and merges them:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold">Our own indexer</span> — reads ERC-20 transfer logs to and from each DEX
              pool directly off the chain RPC and turns them into buy/sell events. This is universal (works for any
              token) and produces the fastest, freshest trades — often seconds old.
            </li>
            <li>
              <span className="font-semibold">GeckoTerminal</span> — a keyless market-data source for prices, volume,
              market cap, liquidity, and OHLCV charts.
            </li>
          </ul>
          <p>
            Both write into one database, deduped per transaction. Everything you see — the feed, the tape, the
            screener, charts — reads from that database, so it scales to thousands of users without multiplying calls
            to any upstream source.
          </p>
        </Section>

        <Section id="features" title="Features">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["The Tape", "Every trade on the chain, streaming live — filter to whales ($10k+)."],
              ["Token pages", "Price, market cap, FDV, volume, liquidity, a live chart, and a per-token trade tape."],
              ["Tokens screener", "A sortable, live table of every token — market cap, 24h, volume, age."],
              ["Explore", "Top gainers, most traded, fresh launches, trending cashtags, and a creator leaderboard."],
              ["Social", "Posts, replies, likes, reposts, polls, bookmarks, communities, and 1:1 messages."],
              ["Profiles", "Wallet-native identity with live on-chain activity, followers, and tipping."],
            ].map(([t, d]) => (
              <div key={t} className="surface rounded-xl p-4">
                <div className="font-bold">{t}</div>
                <div className="mt-0.5 text-[13px] text-[var(--muted)]">{d}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="identity" title="Identity & safety">
          <p>
            Your identity is your wallet — no email, no password. Browsing is free; posting uses a one-time gasless
            signature (never a transaction). You can mute, block, delete your own posts, and manage everything from
            Settings.
          </p>
        </Section>

        <Section id="roadmap" title="Roadmap">
          <ul className="list-disc space-y-2 pl-5">
            <li>Price & wallet alerts (get pinged when a token moves or a wallet you follow trades).</li>
            <li>Verified trader track records — real on-chain P&amp;L on profiles.</li>
            <li>Token safety scores — liquidity, holder concentration, and rug risk at a glance.</li>
            <li>Deeper indexing — full historical trade history straight from the chain.</li>
          </ul>
        </Section>

        <p className="border-t hairline pt-6 text-[13px] text-[var(--muted)]">
          The Tavern · live from Robinhood Chain · not financial advice · wallet data is public.
        </p>
      </div>
    </div>
  );
}
