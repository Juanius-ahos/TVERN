export const metadata = { title: "Docs, The Tavern" };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-[21px] font-extrabold tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--text)]/85">{children}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[color:var(--accent)]/12 text-[13px] font-bold text-[var(--accent-text)]">
        {n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-[14px] text-[var(--muted)]">{children}</div>
      </div>
    </div>
  );
}

function Endpoint({ path, desc, resp, params }: { path: string; desc: string; resp: string; params?: string }) {
  return (
    <div className="surface rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[color:var(--up)]/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-[var(--up)]">
          GET
        </span>
        <code className="text-[13.5px] font-semibold text-[var(--text)]">{path}</code>
      </div>
      <p className="mt-2 text-[13.5px] text-[var(--muted)]">{desc}</p>
      {params && (
        <p className="mt-1.5 text-[12.5px] text-[var(--faint)]">
          <span className="font-semibold text-[var(--muted)]">Params:</span> {params}
        </p>
      )}
      <pre className="mt-2.5 overflow-x-auto rounded-lg border hairline bg-[color:var(--bg)]/60 p-2.5 text-[12px] leading-relaxed text-[var(--text)]/80">
        <code>{resp}</code>
      </pre>
    </div>
  );
}

const TOC = [
  ["what", "Overview"],
  ["start", "Getting started"],
  ["using", "Using The Tavern"],
  ["pons", "Pons launches"],
  ["live", "Live data engine"],
  ["chain", "Robinhood Chain"],
  ["identity", "Identity & safety"],
  ["api", "Developer API"],
  ["roadmap", "Roadmap"],
];

export default function DocsPage() {
  return (
    <div>
      <header className="glass sticky top-11 z-20 border-b hairline px-4 py-3">
        <h1 className="text-[19px] font-bold tracking-tight">Docs</h1>
        <p className="text-[13px] text-[var(--muted)]">How The Tavern works, for people and for developers</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
        <div>
          <h2 className="brand-gradient display text-[30px] font-semibold tracking-tight">The Tavern</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-[var(--text)]/85">
            The social layer and live market terminal for Robinhood Chain. Watch the whales, read the tape, discuss
            every token, all in one place, all in real time.
          </p>
        </div>

        {/* section nav */}
        <nav className="flex flex-wrap gap-2">
          {TOC.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border hairline px-3 py-1 text-[12.5px] text-[var(--muted)] transition hover:border-[color:var(--accent)]/40 hover:text-[var(--text)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section id="what" title="What it is">
          <p>
            The Tavern is where Robinhood Chain gathers. It fuses a social network with a live market terminal: post
            and reply like a feed, but every <span className="font-semibold text-[var(--accent-text)]">$ticker</span>{" "}
            links to a live asset page with price, market cap, a chart, and a streaming trade tape.
          </p>
          <p>
            It is scoped entirely to Robinhood Chain, no global crypto noise. Tokenized stocks (NVDA, TSLA, SPY),
            memecoins, and fresh launches, all native to the chain.
          </p>
        </Section>

        <Section id="start" title="Getting started">
          <div className="space-y-4">
            <Step n={1} title="Browse freely">
              You don&apos;t need an account to explore. Open <b>Markets</b> for the live token screener,{" "}
              <b>Explore</b> for movers and trends, or any <b>$ticker</b> to see its chart and trades.
            </Step>
            <Step n={2} title="Connect your wallet">
              Click <b>Connect wallet</b> and approve a one-time signature. It&apos;s <b>gasless</b>, a signature, never
              a transaction, and there&apos;s no email or password. Your wallet is your identity.
            </Step>
            <Step n={3} title="Follow the action">
              Follow wallets (the whales) and people. Their trades and posts flow into your <b>Home</b> feed in real
              time.
            </Step>
            <Step n={4} title="Join in">
              Post with a <b>$ticker</b> to auto-link the asset, reply, repost, like, run polls, join communities, and
              DM other traders.
            </Step>
          </div>
        </Section>

        <Section id="using" title="Using The Tavern">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Markets", "The live token screener, every token on the chain, sortable by price, 24h, market cap, volume, and age. Filter to stocks or fresh launches."],
              ["The Tape", "Every trade on the chain, streaming live. Filter to whales ($10k+) to watch the big money move."],
              ["Asset pages", "Open any $ticker for price, market cap, FDV, volume, liquidity, a live chart, and a per-token trade tape."],
              ["Explore", "Top gainers, most traded, fresh launches, trending cashtags, and a creator leaderboard."],
              ["Feed & social", "Posts, replies, likes, reposts, polls, bookmarks, communities, and 1:1 messages, a real social layer."],
              ["Profiles & watchlist", "Wallet-native identity with live on-chain activity and tipping; save tokens to your watchlist to track them."],
            ].map(([t, d]) => (
              <div key={t} className="surface card-hover rounded-xl p-4">
                <div className="font-bold">{t}</div>
                <div className="mt-0.5 text-[13px] text-[var(--muted)]">{d}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="pons" title="Pons launches">
          <p>
            Most fresh tokens on Robinhood Chain are minted through{" "}
            <a href="https://www.ponsfamily.com" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-text)] hover:underline">
              Pons
            </a>
            , the chain&apos;s launchpad. The Tavern surfaces every Pons launch the moment it lands, so the{" "}
            <b>Launches</b> feed and the <b>NEW</b> tags on the tape are live, not a daily digest.
          </p>
          <p>How a Pons launch works, so you know what a launch card is telling you:</p>
          <div className="space-y-4">
            <Step n={1} title="Create">
              The token mints with a fixed supply of one billion and its WETH pool goes live in a single transaction.
              The pool&apos;s liquidity is locked automatically. There is no bonding curve and no later migration.
            </Step>
            <Step n={2} title="Trade">
              Buys and sells run against WETH in that same locked pool and move the price. The first two blocks are
              protected: only the creator&apos;s initial buy lands on the launch block, and per-wallet caps apply until
              the window closes.
            </Step>
            <Step n={3} title="Graduate">
              A launch <b>graduates</b> once the WETH paired in the pool reaches the threshold (4.2 ETH by default).
              Trading continues in the same pool, nothing migrates. Graduation is a milestone, not a safety signal.
            </Step>
          </div>
          <p>
            Every launch carries a <b>1% pool fee</b>. The creator keeps most of it and the protocol keeps a share
            (currently 70/30 on the active factory), snapshotted per token at launch. A launch card links straight to
            the token&apos;s page here and out to Pons to trade. The Tavern never holds funds, every trade is a
            transaction your own wallet approves.
          </p>
          <div className="surface rounded-xl border-[color:var(--border-strong)] p-4 text-[13.5px] text-[var(--muted)]">
            Launches are user-created and experimental. Names and logos can be copied, liquidity can be thin, and a
            token can lose all value. Always check the token address before you trade. Nothing here is financial advice.
          </div>
        </Section>

        <Section id="live" title="Live data engine">
          <p>The Tavern reads Robinhood Chain three independent ways, and merges them:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold">Our own indexer</span>, reads ERC-20 transfer logs to and from each DEX
              pool directly off the chain RPC and turns them into buy/sell events. Universal (works for any token) and
              produces the fastest, freshest trades, often seconds old.
            </li>
            <li>
              <span className="font-semibold">Pons launches</span>, read from the Pons launch feed so a new token
              appears the instant it mints, with its market cap and graduation progress, across every factory version.
            </li>
            <li>
              <span className="font-semibold">Market data (GeckoTerminal + DexScreener)</span>, keyless sources for
              prices, volume, market cap, liquidity, logos, and OHLCV charts, merged for the widest token coverage.
            </li>
          </ul>
          <p>
            Reads flow through a shared server cache with last-known-good fallback, so the feed, tape, screener, and
            charts stay live and populated for everyone without hammering any upstream source.
          </p>
        </Section>

        <Section id="chain" title="Robinhood Chain">
          <p>
            Robinhood Chain is an Arbitrum Orbit L2 with ETH for gas. Tokens launch into Uniswap V3 pools and are quoted
            against WETH. The Tavern is scoped entirely to this one chain.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Network", "Robinhood Chain"],
              ["Chain ID", "4663"],
              ["Native asset", "ETH"],
              ["Block time", "~0.1s"],
              ["Pons supply", "1,000,000,000 per token"],
              ["Pool fee", "1% (10000)"],
              ["Graduation", "4.2 ETH paired (default)"],
              ["Creator / protocol fee", "70 / 30 on the active factory"],
            ].map(([k, v]) => (
              <div key={k} className="surface rounded-xl p-3">
                <div className="text-[12px] uppercase tracking-wide text-[var(--faint)]">{k}</div>
                <div className="mt-0.5 font-semibold text-[var(--text)]">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[var(--muted)]">
            Launchpad, contracts, and the full onchain integration surface are documented by Pons at{" "}
            <a href="https://docs.ponsfamily.com" target="_blank" rel="noreferrer" className="text-[var(--accent-text)] hover:underline">
              docs.ponsfamily.com
            </a>
            .
          </p>
        </Section>

        <Section id="identity" title="Identity & safety">
          <p>
            Your identity is your wallet, no email, no password. Browsing is free; posting uses a one-time gasless
            signature (Sign-In with Ethereum), never a transaction. You can mute, block, delete your own posts, and
            manage everything from Settings. Wallet activity shown here is public on-chain data.
          </p>
        </Section>

        <Section id="api" title="Developer API">
          <p>
            The Tavern is built on a public read API, the same endpoints that power this app. Build bots, dashboards,
            alerts, or your own frontend on Robinhood Chain data. No key required for read endpoints.
          </p>
          <div className="surface rounded-xl p-4 text-[13.5px]">
            <div>
              <span className="font-semibold">Base URL</span> ·{" "}
              <code className="text-[var(--accent-text)]">https://tvern.xyz/api</code>
            </div>
            <div className="mt-1 text-[var(--muted)]">
              JSON over HTTPS · read endpoints are open · data is live (seconds fresh). Please cache and be polite.
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg border hairline bg-[color:var(--bg)]/60 p-2.5 text-[12px] text-[var(--text)]/80">
              <code>curl https://tvern.xyz/api/tokens</code>
            </pre>
          </div>

          <h3 className="pt-2 text-[15px] font-bold">Market &amp; tokens</h3>
          <div className="space-y-2.5">
            <Endpoint
              path="/api/tokens"
              desc="The full live token screener plus a market summary, every token on the chain, deduped and ranked."
              resp={`{ "tokens": [{ "symbol", "imageUrl", "quote", "priceUsd",
  "volume24", "liquidityUsd", "mcap", "fdv", "change1h",
  "change24h", "createdAt", "isStock" }], "stats": {
  "tokens", "volume24", "liquidity" } }`}
            />
            <Endpoint
              path="/api/market/ticker"
              desc="The top market tickers (up to 20), compact price + 24h change, for a header ticker or widget."
              resp={`{ "items": [{ "symbol", "priceUsd", "change24h" }] }`}
            />
            <Endpoint
              path="/api/trending"
              desc="Trending tokens right now, plus the biggest movers."
              resp={`{ "trending": [Token], "biggest": [Token] }`}
            />
            <Endpoint
              path="/api/chart/:symbol"
              desc="Price chart points for a single token."
              params="symbol, e.g. NVDA"
              resp={`{ "points": [{ "t", "o", "h", "l", "c" }], "pool" }`}
            />
          </div>

          <h3 className="pt-2 text-[15px] font-bold">Trades &amp; activity</h3>
          <div className="space-y-2.5">
            <Endpoint
              path="/api/tape"
              desc="The live trade tape across the whole chain, newest first."
              params="min, optional USD floor (e.g. 10000 for whales)"
              resp={`{ "trades": [{ "symbol", "side", "usd", "amount",
  "wallet", "txHash", "ts" }] }`}
            />
            <Endpoint
              path="/api/trades/:symbol"
              desc="Recent trades for one token."
              params="symbol, e.g. PONS"
              resp={`{ "trades": [Trade] }`}
            />
            <Endpoint
              path="/api/stats"
              desc="Chain & site totals, events in the last 24h, latest block, ETH price."
              resp={`{ "events24h", "latestBlock", "ethUsd", ... }`}
            />
          </div>

          <h3 className="pt-2 text-[15px] font-bold">Social &amp; discovery</h3>
          <div className="space-y-2.5">
            <Endpoint
              path="/api/feed"
              desc="The social feed, posts plus auto-generated on-chain event cards."
              resp={`{ "items": [Post | Event] }`}
            />
            <Endpoint
              path="/api/feed?filter=launch"
              desc="Fresh Pons launches as event cards, newest first, each with symbol, market cap, and graduation note."
              params="filter, one of launch | whale | stock"
              resp={`{ "items": [{ "type": "event", "kind": "LAUNCH",
  "assetSymbol", "assetAddress", "usdValue", "title", "blockTs" }] }`}
            />
            <Endpoint
              path="/api/discover"
              desc="Everything behind Explore, trending tokens, fresh launches, communities."
              resp={`{ "trending", "launches", "communities", ... }`}
            />
            <Endpoint
              path="/api/search"
              desc="Search across tokens, wallets, and people."
              params="q, the query string"
              resp={`{ "tokens", "wallets", "users" }`}
            />
            <Endpoint
              path="/api/leaderboard"
              desc="Top posters and trending cashtags."
              resp={`{ "topPosters": [User], "trendingTags": [Tag] }`}
            />
          </div>

          <div className="surface rounded-xl border-[color:var(--border-strong)] p-4 text-[13.5px]">
            <div className="font-semibold">Writing data (posting, following, liking…)</div>
            <p className="mt-1 text-[var(--muted)]">
              Actions that write on your behalf require a wallet session. Authenticate with{" "}
              <code>GET /api/auth/nonce</code> → sign it → <code>POST /api/auth/verify</code> to set a session cookie,
              then call the write endpoints (posts, follow, likes, messages, …). These are meant for the app, not
              anonymous access.
            </p>
          </div>
        </Section>

        <Section id="roadmap" title="Roadmap">
          <ul className="list-disc space-y-2 pl-5">
            <li>Price &amp; wallet alerts (get pinged when a token moves or a wallet you follow trades).</li>
            <li>Verified trader track records, real on-chain P&amp;L on profiles.</li>
            <li>Token safety scores, liquidity, holder concentration, and rug risk at a glance.</li>
            <li>Public API keys, webhooks, and higher rate limits for builders.</li>
          </ul>
        </Section>

        <p className="border-t hairline pt-6 text-[13px] text-[var(--muted)]">
          The Tavern · live from Robinhood Chain · not financial advice · wallet data is public.
        </p>
      </div>
    </div>
  );
}
