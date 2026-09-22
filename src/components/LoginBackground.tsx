// Decorative, blurred preview of the app sitting behind the login card
// (like the temp site's blurred mockup). Purely visual — no data, no interaction.

function Line({ w, h = 8, c = "rgba(255,255,255,0.14)" }: { w: string; h?: number; c?: string }) {
  return <div style={{ width: w, height: h, background: c, borderRadius: 6 }} />;
}

function Dot({ c }: { c: string }) {
  return <div className="h-2 w-2 rounded-full" style={{ background: c }} />;
}

function FauxCard({ side, ticker }: { side: "buy" | "sell" | "whale"; ticker: string }) {
  const c = side === "buy" ? "#34d399" : side === "sell" ? "#fb7185" : "#22d3ee";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full" style={{ background: "linear-gradient(135deg,#c6ff32,#12351c)" }} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Dot c={c} />
            <Line w="46px" c={c} h={9} />
            <Line w="34px" />
          </div>
          <Line w="72%" h={12} />
          <Line w="40%" />
        </div>
      </div>
    </div>
  );
}

export function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/* the faux app */}
      <div className="absolute inset-0 opacity-[0.5] blur-[10px]">
        {/* top ticker bar */}
        <div className="flex h-11 items-center gap-5 border-b border-white/10 px-5">
          <div className="flex items-center gap-2">
            <Dot c="#c6ff32" />
            <Line w="110px" />
          </div>
          <Line w="70px" />
          <Line w="90px" />
        </div>

        <div className="mx-auto flex max-w-[1200px]">
          {/* sidebar */}
          <div className="hidden w-60 shrink-0 space-y-4 border-r border-white/10 p-4 lg:block">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg" style={{ background: "#c6ff32" }} />
              <Line w="90px" h={14} />
            </div>
            <div className="space-y-3 pt-2">
              <Line w="60%" h={12} />
              <Line w="55%" h={12} />
              <Line w="50%" h={12} />
            </div>
          </div>

          {/* feed */}
          <div className="flex-1 space-y-3 p-4">
            <FauxCard side="whale" ticker="NVDA" />
            <FauxCard side="buy" ticker="GME" />
            <FauxCard side="sell" ticker="TSLA" />
            <FauxCard side="buy" ticker="LOX" />
            <FauxCard side="sell" ticker="SPY" />
          </div>

          {/* right rail */}
          <div className="hidden w-72 shrink-0 space-y-3 p-4 xl:block">
            <div className="space-y-3 rounded-2xl border border-white/10 p-4">
              <Line w="60%" h={14} />
              <Line w="85%" />
              <Line w="75%" />
              <Line w="80%" />
              <Line w="70%" />
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 p-4">
              <Line w="55%" h={14} />
              <Line w="90%" />
              <Line w="82%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
