# WTF Happened? — web

The social feed for Robinhood Chain. The blockchain is the content: an auto-generated
feed of big tokenized-stock moves + whales, which people discuss, react to, and follow.

## Stack (all free tier)
- Next.js (App Router) + Tailwind
- Prisma + SQLite (local) → Postgres/Neon (prod)
- SIWE wallet login (gasless) via wagmi/viem
- Data: Robinhood Chain public RPC + Blockscout API (keyless), Stooq for prices

## Run locally
```bash
cd web
npm install
npx prisma migrate dev --name init   # creates the SQLite DB + client
npm run dev                           # http://localhost:3000
```

Seed some demo events so the feed isn't empty:
```bash
# with the dev server running:
curl http://localhost:3000/api/seed
```

Pull real events from Robinhood Chain:
```bash
curl http://localhost:3000/api/ingest        # scans stock-token transfers, scores, stores
```

## Keeping the feed live (free)
In production, point a free cron (cron-job.org) at:
`https://<your-domain>/api/ingest?secret=<INGEST_SECRET>` every 60s.
No always-on server needed for V0.

## Env
See `.env.example`. `.env.local` is for Next.js; `.env` is for the Prisma CLI (keep DATABASE_URL in sync).

## Deploy (later, still free)
- Push to GitHub, import into Vercel (root directory = `web`).
- Create a free Neon Postgres DB; set `DATABASE_URL` in Vercel; change `provider` in
  `prisma/schema.prisma` to `postgresql`; run `prisma migrate deploy`.
- Set `JWT_SECRET`, `INGEST_SECRET` in Vercel env.
- Add the cron-job.org trigger.
