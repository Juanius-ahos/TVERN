"use client";

/**
 * Coded, animated, blurred simulation of the app itself — charts, social posts,
 * tickers, interactions — drifting behind the hero. No stock imagery. Uses the
 * app's own tokens (surface / accent / up / down) so it reads as *this* product.
 * Data is static (no Math.random) to avoid hydration mismatches.
 */

const UP = "var(--up)";
const DOWN = "var(--down)";

function chartPath(ys: number[]) {
  const step = 240 / (ys.length - 1);
  const line = ys.map((y, i) => `${(i * step).toFixed(0)},${y}`).join(" ");
  const area = `M0,${ys[0]} ` + ys.map((y, i) => `L${(i * step).toFixed(0)},${y}`).join(" ") + " L240,96 L0,96 Z";
  return { line, area, lastY: ys[ys.length - 1] };
}

function ChartCard({ sym, price, chg, up, ys }: { sym: string; price: string; chg: string; up: boolean; ys: number[] }) {
  const { line, area, lastY } = chartPath(ys);
  const col = up ? UP : DOWN;
  return (
    <div className="lb-card">
      <div className="lb-head">
        <span className="lb-sym">${sym}</span>
        <span className="lb-price">{price}</span>
        <span className="lb-chg" style={{ color: col }}>{chg}</span>
      </div>
      <svg viewBox="0 0 240 96" className="lb-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${sym}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g-${sym})`} />
        <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="240" cy={lastY} r="3.5" fill="var(--accent)" className="lb-pulse" />
      </svg>
    </div>
  );
}

function PostCard({ handle, text, chip, up }: { handle: string; text: string; chip: string; up: boolean }) {
  return (
    <div className="lb-card">
      <div className="lb-post-h">
        <span className="lb-av" />
        <span className="lb-bar" style={{ width: 84 }} />
        <span className="lb-bar lb-faint" style={{ width: 52 }} />
        <span className="lb-bar lb-faint lb-ml" style={{ width: 26 }} />
      </div>
      <div className="lb-post-t">{text}</div>
      <div className="lb-chip" style={{ color: up ? UP : DOWN, borderColor: up ? "color-mix(in srgb, var(--up) 40%, transparent)" : "color-mix(in srgb, var(--down) 40%, transparent)" }}>
        {chip}
      </div>
      <div className="lb-meta">
        <span className="lb-ico" /> <span className="lb-ico" /> <span className="lb-ico" />
      </div>
    </div>
  );
}

function TickerCard({ items }: { items: { s: string; p: string; c: string; up: boolean }[] }) {
  return (
    <div className="lb-card lb-tick">
      {items.map((t) => (
        <div className="lb-tick-row" key={t.s}>
          <span className="lb-sym">${t.s}</span>
          <span className="lb-tick-p">{t.p}</span>
          <span className="lb-chg" style={{ color: t.up ? UP : DOWN }}>{t.c}</span>
        </div>
      ))}
    </div>
  );
}

const UPTREND = [72, 64, 66, 50, 54, 40, 44, 30, 24];
const DOWNTREND = [26, 30, 26, 40, 44, 50, 56, 62, 70];
const CHOP = [50, 44, 54, 42, 56, 46, 58, 44, 48];

function ColA() {
  return (
    <>
      <ChartCard sym="NVDA" price="$182.40" chg="+1.8%" up ys={UPTREND} />
      <PostCard handle="diamondhands" text="aped into $NVDA on-chain 🍻 the tavern is loud tonight" chip="$NVDA ▲ 1.8%" up />
      <TickerCard items={[{ s: "AI", p: "$0.24", c: "+7.1%", up: true }, { s: "MEME", p: "$0.033", c: "+12.4%", up: true }, { s: "GME", p: "$0.0000070", c: "-6.9%", up: false }]} />
      <ChartCard sym="PONS" price="$0.6636" chg="+1.0%" up ys={CHOP} />
    </>
  );
}
function ColB() {
  return (
    <>
      <PostCard handle="0x9f…a2c1" text="whale just moved $187K into tokenized stock" chip="$SPCX ▲ 3.4%" up />
      <ChartCard sym="TSLA" price="$41.10" chg="+0.9%" up ys={UPTREND} />
      <PostCard handle="paperhands" text="sold the bottom again, someone stop me" chip="$GME ▼ 6.9%" up={false} />
      <TickerCard items={[{ s: "ROBIN", p: "$0.0043", c: "-2.1%", up: false }, { s: "SHROOM", p: "$0.0176", c: "+5.2%", up: true }, { s: "MSTR", p: "$310", c: "+4.2%", up: true }]} />
    </>
  );
}
function ColC() {
  return (
    <>
      <ChartCard sym="GME" price="$0.0000070" chg="-6.9%" up={false} ys={DOWNTREND} />
      <TickerCard items={[{ s: "HOOD", p: "$61.20", c: "+2.4%", up: true }, { s: "COIN", p: "$188", c: "+0.7%", up: true }, { s: "PLTR", p: "$41.9", c: "+1.3%", up: true }]} />
      <PostCard handle="moonbag.eth" text="this chain never sleeps and neither do i" chip="$MEME ▲ 12%" up />
      <ChartCard sym="SHROOM" price="$0.0176" chg="+5.2%" up ys={CHOP} />
    </>
  );
}

export function LandingBackdrop() {
  return (
    <div aria-hidden className="landing-bg">
      <div className="lb-col lb-a"><ColA /><ColA /></div>
      <div className="lb-col lb-b"><ColB /><ColB /></div>
      <div className="lb-col lb-c"><ColC /><ColC /></div>
    </div>
  );
}
