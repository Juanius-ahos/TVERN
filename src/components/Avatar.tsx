"use client";

// Custom PFP when set, otherwise a smooth deterministic gradient from the address.

function hashInt(s: string, start: number, len: number): number {
  const h = s.toLowerCase().replace(/^0x/, "");
  return parseInt(h.slice(start, start + len) || "0", 16) || 0;
}

export function gradientFor(address: string): string {
  const a = address || "0x0";
  const h1 = hashInt(a, 0, 6) % 360;
  const h2 = (h1 + 60 + (hashInt(a, 6, 4) % 180)) % 360;
  const h3 = (h2 + 40 + (hashInt(a, 10, 4) % 120)) % 360;
  return `linear-gradient(135deg, hsl(${h1} 85% 60%), hsl(${h2} 80% 52%) 55%, hsl(${h3} 75% 45%))`;
}

export function Avatar({
  address,
  src,
  size = 40,
  ring = false,
}: {
  address: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const common = `shrink-0 rounded-full ${ring ? "ring-2 ring-[var(--bg)]" : ""}`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`${common} object-cover`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={common}
      style={{
        width: size,
        height: size,
        backgroundImage: gradientFor(address),
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.25)",
      }}
      aria-hidden="true"
    />
  );
}
