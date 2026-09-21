# 🍺 TVERN — The Tavern

**X meets a live blockchain feed.** A free social layer for **Robinhood Chain** — the chain
fills the feed automatically, and traders, memers & degens follow the whales, react to the
moves, and roast the paper hands.

This repo is the **coming-soon page**, served at **[tvern.xyz](https://tvern.xyz)**.

## Local preview
It's a single static file — just open `index.html` in a browser. No build step, no dependencies.

## Deploy (GitHub Pages)
1. Push to the `main` branch of this repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. `CNAME` points the site at `tvern.xyz`. In your domain registrar's DNS, add:
   - Four `A` records for the apex `tvern.xyz` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (optional) a `CNAME` record for `www` → `juanius-ahos.github.io`
4. Back in **Settings → Pages**, enable **Enforce HTTPS** once the certificate is issued.

## Wiring the waitlist to a real endpoint
Right now the email form stores signups in the visitor's `localStorage` (front-end only).
To collect emails for real, point the form at a no-backend service:

- **Formspree** — create a form, then in `index.html` set the `<form>` to
  `action="https://formspree.io/f/XXXX" method="POST"` and give the input `name="email"`.
- **Tally / Google Forms** — or just swap the form for a link to a hosted form.

## Branding
- Primary lime: `#c8f135` · ink/near-black: `#0e0e13` · foam: `#fbfbf4`
- The mug is an inline animated SVG (foam bob, beer slosh, rising bubbles). Drop the original
  PNG logo in as `og-image.png` (1200×630) for a pixel-perfect social preview if desired.

---
*The Tavern is an independent product and is not affiliated with, endorsed by, or sponsored by
Robinhood Markets, Inc. Nothing here is financial advice.*
