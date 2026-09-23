# The Tavern — Browser Smoke-Test Checklist

Target: **production** `https://web-juans-projects-853e3122.vercel.app/` (use the stable URL,
never a per-deploy URL). Run after every deployment of the `app` branch.

Use an incognito/private window for sign-in steps so the wallet flow starts clean.

## 1. Public pages (no wallet)

| # | Step | Expect |
|---|------|--------|
| 1.1 | Open `/` | Feed renders recent posts + auto-generated event cards; numbers update every ~20s without a full reload |
| 1.2 | Open `/tokens` | Sorted token table; sorting by Price/24h/Mkt Cap works; search + filter work |
| 1.3 | Open `/live` | Live tape shows fresh trades/launches; entries tick in |
| 1.4 | Open `/whales` | Whale moves render (LAUNCH/BIG moves) |
| 1.5 | Open `/explore`, `/search` | Search by address/ticker returns results; trending lists render |
| 1.6 | Open `/stock`, `/asset/AAPL` (or any symbol) | Asset page renders real price + on-chain activity |
| 1.7 | Open `/c/tavern` and `/communities` | Community page + community list render |
| 1.8 | Open `/docs` | Docs page renders |
| 1.9 | Open `/asset/nonexistent-symbol-xyz` | Shows the styled 404 page (no default Next error) |
| 1.10 | Hard refresh `/` | No console errors; page is interactive |

## 2. API endpoints (paste in a tab)

Each must return JSON and include `cache-control: no-store` (check via DevTools → Network):

- `/api/feed` — posts + events
- `/api/tape` — recent trades
- `/api/tokens` — token universe (75+)
- `/api/discover` — trending/communities
- `/api/stats` — totals (events/24h, latest block, ETH price)
- `/api/auth/nonce` — fresh nonce each call

## 3. Sign-in + social (wallet)

| # | Step | Expect |
|---|------|--------|
| 3.1 | Click **Sign in** → connect wallet | MetaMask/Coinbase Wallet prompt; after signing, session persists and avatar appears in the header |
| 3.2 | Create a post with a `$TICKER` mention | Post appears in feed; ticker auto-links to the asset page |
| 3.3 | **Follow** someone | Unread counters update; their posts show in your feed later |
| 3.4 | **Like / comment / repost** a post | Counts update instantly, no reload |
| 3.5 | Open `/bookmarks` and bookmark a post | Bookmark appears there |
| 3.6 | Open `/watchlist` and watch a token | It appears in the watchlist |
| 3.7 | Open your profile `/wallet/<your address>` | Tabs (Posts / Replies / Media / Activity) render; on-chain activity with the empty-state text when none |
| 3.8 | Open `/messages`, start a DM | Message thread sends + receives |
| 3.9 | Open `/settings` | Theme toggle flips dark/light and persists on refresh |
| 3.10 | Upload an image to a post | Image uploads to Blob and displays in the post |

## 4. Hygiene checks

- **404/500 pages**: visit a bogus route — should show the branded error page, not the default.
- **Console**: open DevTools console on `/` — no React/network errors (console.error from the
  error boundary is expected only when a route actually fails).
- **Mobile**: repeat a quick pass at ≤420px width — no horizontal scroll, bottom nav usable.
- **Dark/light**: both themes are readable on every section visited.

## Still deploying manually?

Auto-deploy world isn't connected yet (blocked on one-time GitHub authorization in Vercel
Dashboard → project `web` → **Settings → Git → Connect Repository**, selecting
`Juanius-ahos/TVERN`, production branch `app`). Until then:

```bash
cd web
vercel --prod --yes    # then re-run this checklist against the stable URL
```

Unit tests before deploy:

```bash
cd web
npm test               # vitest
```