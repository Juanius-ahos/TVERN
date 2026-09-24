"use client";

import { useEffect, useRef, useState } from "react";
import { LiveTape } from "./LiveTape";
import { Logo } from "./Logo";

/* ------------------------------------------------------------------ helpers */

function fmtBig(n: number): string {
  if (!isFinite(n)) return "0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* --------------------------------------------------- scroll reveal (shared) */

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".ld-reveal"));
    if (prefersReducedMotion()) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.16 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* --------------------------------------------- animated count-up on reveal */

function Counter({ to, format, duration = 1500 }: { to: number; format: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || to <= 0) {
      const id = requestAnimationFrame(() => setVal(to));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let started = false;
    const run = (t0: number) => {
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          run(performance.now());
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [to, duration]);
  return <span ref={ref}>{format(val)}</span>;
}

/* --------------------------------------------------- 3D particle field bg */

function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;
    const cv: HTMLCanvasElement = ref.current;
    const c2d = cv.getContext("2d");
    if (!c2d) return;
    const ctx: CanvasRenderingContext2D = c2d;

    let w = 0;
    let h = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const mouse = { x: -9999, y: -9999 };

    type P = { x: number; y: number; z: number; vx: number; vy: number };
    let pts: P[] = [];

    function resize() {
      const rect = cv.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / 14000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.35 + Math.random() * 0.65,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    }

    let raf = 0;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ccff00";

      for (const p of pts) {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        // gentle pull toward mouse for parallax life
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 20000) {
          p.x -= (dx / 800) * p.z;
          p.y -= (dy / 800) * p.z;
        }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 118) {
            const o = (1 - dist / 118) * 0.5 * Math.min(a.z, b.z);
            ctx.strokeStyle = accent;
            ctx.globalAlpha = o;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // dots
      ctx.globalAlpha = 1;
      for (const p of pts) {
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.35 + p.z * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.z * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      const rect = cv.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);
  return <canvas ref={ref} className="ld-particles" aria-hidden="true" />;
}

/* --------------------------------------------------------- 3D tilt card */

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(6px)`;
    el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  }
  function reset() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={`ld-tilt ${className}`}>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------- launches strip */

type Launch = { id: string; assetSymbol: string; title: string; imageUrl?: string | null; progressPct?: number | null };

function LiveLaunches() {
  const [items, setItems] = useState<Launch[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await fetch("/api/feed?filter=launch", { cache: "no-store" }).then((r) => r.json());
        if (!alive) return;
        setItems((d.items ?? []).filter((x: { kind?: string }) => x.kind === "LAUNCH").slice(0, 8));
      } catch {}
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!items.length) {
    return <p className="text-[13px] text-[var(--muted)]">Pouring the latest kegs from Pons...</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((l) => {
        const pct = typeof l.progressPct === "number" ? Math.max(0, Math.min(100, l.progressPct)) : 0;
        return (
          <a
            key={l.id}
            href={`/asset/${l.assetSymbol}`}
            className="ld-launch group flex items-center gap-3 rounded-xl border hairline bg-[var(--surface)] p-3 transition hover:border-[color:var(--accent)]/40"
          >
            {l.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt={l.assetSymbol} className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[color:var(--accent)]/25" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--accent)]/15 text-[13px] font-bold text-[var(--accent-text)]">
                {l.assetSymbol.slice(0, 2)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold">${l.assetSymbol}</span>
                <span className="ml-auto text-[11px] font-semibold text-[var(--muted)]">
                  {pct >= 100 ? "Graduated" : `${pct.toFixed(pct < 10 ? 1 : 0)}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--border-strong)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(3, pct)}%` }} />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------ 3D product preview card */

function ProductPreview() {
  // A realistic, static mock of the app itself: token header, chart, live rows.
  const ys = [58, 54, 60, 49, 52, 44, 47, 38, 41, 33, 36, 28, 24, 27, 19];
  const step = 300 / (ys.length - 1);
  const line = ys.map((y, i) => `${(i * step).toFixed(1)},${y}`).join(" ");
  const area = `M0,${ys[0]} ` + ys.map((y, i) => `L${(i * step).toFixed(1)},${y}`).join(" ") + " L300,120 L0,120 Z";
  const rows = [
    { k: "BUY", sym: "NVDA", usd: "$24.1K", cls: "text-emerald-400" },
    { k: "NEW", sym: "SEEDX", usd: "$4.5K", cls: "text-[var(--accent-text)]" },
    { k: "SELL", sym: "ROBIN", usd: "$8.7K", cls: "text-rose-400" },
  ];
  return (
    <div className="ld-preview">
      <div className="ld-preview-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--accent)]/15 text-[12px] font-bold text-[var(--accent-text)]">
            N
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-bold">$NVDA</div>
            <div className="text-[11px] text-[var(--muted)]">Robinhood Chain</div>
          </div>
          <div className="ml-auto text-right leading-tight">
            <div className="text-[14px] font-bold tabular-nums">$182.40</div>
            <div className="text-[11px] font-semibold text-emerald-400">+4.2%</div>
          </div>
        </div>
        <svg viewBox="0 0 300 120" className="h-24 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ld-pg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#ld-pg)" />
          <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="300" cy={ys[ys.length - 1]} r="3.5" fill="var(--accent)" className="lb-pulse" />
        </svg>
        <div className="mt-3 space-y-1.5 border-t hairline pt-3">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <span className={`w-9 shrink-0 font-bold ${r.cls}`}>{r.k}</span>
              <span className="font-bold">${r.sym}</span>
              <span className="ml-auto font-semibold tabular-nums text-[var(--muted)]">{r.usd}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ld-preview-chip ld-preview-chip-a">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> Live tape
      </div>
      <div className="ld-preview-chip ld-preview-chip-b">🍻 New launch</div>
    </div>
  );
}

/* --------------------------------------------------------------- features */

const FEATURES: { icon: string; title: string; body: string }[] = [
  { icon: "M12 3v18M3 12h18", title: "Live launches", body: "Every Pons launch hits the feed the second it mints, with market cap and graduation progress." },
  { icon: "M4 18l6-6 4 4 6-8", title: "The tape", body: "Every buy and sell on the chain, streaming live. Filter to whales and watch the big money move." },
  { icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20", title: "Real markets", body: "A live screener for every token, price, volume, liquidity, and charts, quoted straight off the pools." },
  { icon: "M17 8a5 5 0 10-10 0M3 21v-2a7 7 0 0114 0v2", title: "Wallet-native", body: "Your wallet is your identity. Follow the whales and the people. No email, no password, gasless sign-in." },
  { icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", title: "Social first", body: "Post, reply, repost, poll, and run communities. Every $ticker links to its live asset page." },
  { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", title: "Toast the winners", body: "React to the moves, quote the launches, and tip the callers. This is where the culture trades." },
];

/* ----------------------------------------------------------------- page */

export function Landing() {
  useReveal();
  const heroRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<{ tokens: number; volume24: number; liquidity: number } | null>(null);

  useEffect(() => {
    fetch("/api/tokens", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.stats && setStats(d.stats))
      .catch(() => {});
  }, []);

  // hero mouse parallax
  useEffect(() => {
    if (!heroRef.current || prefersReducedMotion()) return;
    const hero: HTMLDivElement = heroRef.current;
    function onMove(e: MouseEvent) {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty("--px", String(px));
      hero.style.setProperty("--py", String(py));
    }
    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="ld-root ld-fullbleed">
      <style>{LD_CSS}</style>

      {/* ===================================================== LANDING NAV */}
      <header className="ld-nav sticky top-0 z-40 border-b hairline">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 sm:px-10">
          <div className="flex items-center">
            <Logo />
          </div>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <a href="/explore" className="hidden rounded-full px-3 py-1.5 text-[14px] text-[var(--muted)] transition hover:text-[var(--text)] sm:block">
              Explore
            </a>
            <a href="/tokens" className="hidden rounded-full px-3 py-1.5 text-[14px] text-[var(--muted)] transition hover:text-[var(--text)] sm:block">
              Markets
            </a>
            <a href="/docs" className="hidden rounded-full px-3 py-1.5 text-[14px] text-[var(--muted)] transition hover:text-[var(--text)] sm:block">
              Docs
            </a>
            <a href="/login" className="btn-accent rounded-full px-5 py-2 text-[14px] font-semibold">
              Connect wallet
            </a>
          </nav>
        </div>
      </header>

      {/* ============================================================ HERO */}
      <section ref={heroRef} className="ld-hero relative overflow-hidden border-b hairline">
        <div className="ld-grid" aria-hidden="true">
          <div className="ld-grid-inner" />
        </div>
        <ParticleField />
        <div className="ld-hero-glow" aria-hidden="true" />

        <div className="relative z-[3] mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="ld-parallax">
            <div className="ld-badge mb-6 inline-flex items-center gap-2 rounded-full border hairline bg-[color:var(--bg)]/60 px-3 py-1 text-[12px] font-medium text-[var(--muted)] backdrop-blur">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Live on Robinhood Chain
            </div>

            <h1 className="display text-[46px] font-semibold leading-[1.0] tracking-tight sm:text-[76px]">
              Where the chain
              <br />
              <span className="ld-shine">gathers.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[var(--muted)] sm:text-[19px]">
              The social layer and live market for Robinhood Chain. Every token, every trade, and every conversation,
              poured live in one place. Follow the whales, react to the moves, and trade the culture.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="/login" className="btn-accent rounded-full px-7 py-3 text-[15px] font-semibold">
                Connect wallet
              </a>
              <a href="/explore" className="btn-ghost rounded-full px-7 py-3 text-[15px] font-semibold">
                Explore the chain
              </a>
            </div>
          </div>

          {/* Floating product preview */}
          <div className="ld-parallax-strong hidden justify-center lg:flex">
            <ProductPreview />
          </div>
        </div>

        <a href="#live" className="ld-scroll absolute bottom-5 left-1/2 z-[3] -translate-x-1/2 text-[var(--muted)]" aria-label="Scroll down">
          <span className="ld-mouse" />
        </a>
      </section>

      {/* ========================================================== STATS */}
      <section className="border-b hairline">
        <div className="ld-reveal mx-auto grid max-w-5xl grid-cols-2 gap-px px-4 py-2 sm:grid-cols-4">
          {[
            { label: "tokens tracked", val: <Counter to={stats?.tokens ?? 0} format={(n) => Math.round(n).toString()} /> },
            { label: "24h volume", val: <Counter to={stats?.volume24 ?? 0} format={fmtBig} /> },
            { label: "liquidity", val: <Counter to={stats?.liquidity ?? 0} format={fmtBig} /> },
            { label: "trade tape", val: "Live" },
          ].map((s, i) => (
            <div key={i} className="px-4 py-6 text-center">
              <div className="display text-[28px] font-semibold tabular-nums text-[var(--text)] sm:text-[34px]">{s.val}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--faint)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-24">
        <div className="ld-reveal mb-12 max-w-xl">
          <h2 className="display text-[32px] font-semibold tracking-tight sm:text-[42px]">One bar, the whole chain.</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[var(--muted)]">
            A social network fused with a market terminal, scoped entirely to Robinhood Chain. No global crypto noise,
            just what is moving here, right now.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="ld-reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <TiltCard className="ld-feature h-full rounded-2xl border hairline bg-[var(--surface)] p-6">
                <div className="ld-feature-glow" aria-hidden="true" />
                <div className="relative">
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--accent)]/12 text-[var(--accent-text)]">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </span>
                  <h3 className="text-[17px] font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">{f.body}</p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================== LIVE SECTION */}
      <section id="live" className="border-y hairline bg-[color:var(--surface)]/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-2">
          <div className="ld-reveal">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="display text-[24px] font-semibold">Fresh kegs from Pons</h2>
              <a href="/explore" className="text-[13px] text-[var(--muted)] transition hover:text-[var(--text)]">
                View all
              </a>
            </div>
            <LiveLaunches />
          </div>

          <div className="ld-reveal" style={{ transitionDelay: "80ms" }}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="display text-[24px] font-semibold">The tape, live</h2>
              <span className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Robinhood Chain</span>
            </div>
            <LiveTape title="Live trades" emptyText="Listening to the chain..." compact />
          </div>
        </div>
      </section>

      {/* ====================================================== HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-24">
        <h2 className="ld-reveal display mb-12 text-center text-[32px] font-semibold tracking-tight sm:text-[42px]">
          Pull up a stool.
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            ["01", "Connect your wallet", "One gasless signature. No email, no password. Your wallet is your seat at the bar."],
            ["02", "Follow the action", "Track whales and callers. Their trades and posts pour into your feed in real time."],
            ["03", "Trade the culture", "Post a $ticker, quote a launch, tip a caller. This is where the chain talks and trades."],
          ].map(([n, t, b], i) => (
            <div key={n} className="ld-reveal text-center" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="display mx-auto mb-3 text-[40px] font-semibold text-[color:var(--accent)]/30">{n}</div>
              <h3 className="text-[17px] font-bold">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== CTA */}
      <section className="relative overflow-hidden border-t hairline">
        <div className="ld-cta-glow" aria-hidden="true" />
        <div className="ld-reveal relative z-[2] mx-auto max-w-3xl px-6 py-24 text-center sm:py-28">
          <h2 className="display text-[38px] font-semibold leading-tight tracking-tight sm:text-[56px]">
            The Tavern is open.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-[var(--muted)]">
            Reading is on the house. Connect your wallet to pull up a stool, post, and toast the winners.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/login" className="btn-accent rounded-full px-8 py-3.5 text-[16px] font-semibold">
              Connect wallet
            </a>
            <a href="https://x.com/TVERN_xyz" target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-8 py-3.5 text-[16px] font-semibold">
              Follow on X
            </a>
          </div>
          <p className="mt-10 text-[12px] text-[var(--faint)]">
            Independent and not affiliated with, endorsed by, or sponsored by Robinhood Markets, Inc. Nothing here is
            financial advice.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- styles */

const LD_CSS = `
.ld-root { --px: 0; --py: 0; }

/* hero */
.ld-hero { background:
  radial-gradient(1100px 460px at 78% -10%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%),
  var(--bg); }
.ld-particles { position:absolute; inset:0; width:100%; height:100%; z-index:1; opacity:.9; }
.ld-hero-glow { position:absolute; right:-10%; top:-20%; width:520px; height:520px; z-index:1;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 16%, transparent), transparent 62%);
  filter: blur(30px); pointer-events:none; }

/* perspective 3D grid floor */
.ld-grid { position:absolute; left:0; right:0; bottom:0; height:52%; z-index:0; overflow:hidden;
  perspective: 320px; -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 92%);
  mask-image: linear-gradient(to top, #000 10%, transparent 92%); opacity:.55; }
.ld-grid-inner { position:absolute; left:-50%; right:-50%; bottom:-2px; top:-60%;
  background-image:
    linear-gradient(color-mix(in srgb, var(--accent) 45%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 45%, transparent) 1px, transparent 1px);
  background-size: 46px 46px; transform: rotateX(74deg); transform-origin: 50% 100%;
  animation: ld-grid 5.5s linear infinite; }
@keyframes ld-grid { to { background-position: 0 46px, 0 46px; } }

/* parallax layers follow --px/--py from the hero */
.ld-parallax { transform: translate3d(calc(var(--px) * -12px), calc(var(--py) * -10px), 0); transition: transform .18s ease-out; }
.ld-parallax-strong { transform: translate3d(calc(var(--px) * 26px), calc(var(--py) * 20px), 0); transition: transform .2s ease-out; }

/* headline shine */
.ld-shine { background: linear-gradient(100deg, var(--text) 30%, var(--accent) 50%, var(--text) 70%);
  background-size: 220% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
  animation: ld-shine 5.5s ease-in-out infinite; }
@keyframes ld-shine { 0%,100%{ background-position: 120% 0; } 50%{ background-position: -20% 0; } }

/* landing nav */
.ld-nav { background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: saturate(120%) blur(14px); -webkit-backdrop-filter: saturate(120%) blur(14px); }

/* floating product preview */
.ld-preview { position:relative; width:100%; max-width:380px; animation: ld-float 7s ease-in-out infinite; }
@keyframes ld-float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-12px); } }
.ld-preview-card { position:relative; border-radius:20px; padding:18px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, #fff 3%), var(--surface));
  border: 1px solid var(--border-strong);
  box-shadow: 0 40px 80px -30px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.02) inset,
    0 0 60px -20px color-mix(in srgb, var(--accent) 40%, transparent);
  transform: perspective(1200px) rotateY(-14deg) rotateX(6deg); transform-style:preserve-3d; }
.ld-preview-chip { position:absolute; display:inline-flex; align-items:center; gap:6px;
  border-radius:999px; padding:6px 12px; font-size:12px; font-weight:600;
  background: color-mix(in srgb, var(--surface) 80%, transparent); border:1px solid var(--border-strong);
  backdrop-filter: blur(8px); box-shadow: 0 12px 30px -14px rgba(0,0,0,.6); }
.ld-preview-chip-a { top:8px; left:-42px; animation: ld-float 6s ease-in-out infinite; }
.ld-preview-chip-b { bottom:24px; right:-30px; color: var(--accent-text);
  animation: ld-float 8s ease-in-out .6s infinite; }

/* scroll cue */
.ld-scroll { opacity:.7; transition: opacity .2s; } .ld-scroll:hover { opacity:1; }
.ld-mouse { display:block; width:22px; height:34px; border:2px solid currentColor; border-radius:12px; position:relative; }
.ld-mouse::after { content:""; position:absolute; left:50%; top:6px; width:3px; height:6px; border-radius:2px;
  background: var(--accent); transform:translateX(-50%); animation: ld-mouse 1.5s ease-in-out infinite; }
@keyframes ld-mouse { 0%{ opacity:0; transform:translate(-50%,0);} 30%{opacity:1;} 100%{ opacity:0; transform:translate(-50%,10px);} }

/* reveal */
.ld-reveal { opacity:0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
.ld-reveal.in { opacity:1; transform:none; }

/* tilt + feature cards */
.ld-tilt { transition: transform .25s cubic-bezier(.2,.7,.2,1); transform-style:preserve-3d; will-change:transform; }
.ld-feature { position:relative; overflow:hidden; }
.ld-feature-glow { position:absolute; inset:0; opacity:0; transition:opacity .3s;
  background: radial-gradient(320px at var(--gx,50%) var(--gy,0%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%); }
.ld-tilt:hover .ld-feature-glow { opacity:1; }
.ld-tilt:hover { border-color: color-mix(in srgb, var(--accent) 40%, var(--border)); }

/* cta glow */
.ld-cta-glow { position:absolute; inset:0;
  background: radial-gradient(700px 300px at 50% 120%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%); }

@media (prefers-reduced-motion: reduce) {
  .ld-grid-inner, .ld-shine, .ld-mouse::after, .ld-preview, .ld-preview-chip { animation: none !important; }
  .ld-parallax, .ld-parallax-strong { transform: none !important; }
}
`;
