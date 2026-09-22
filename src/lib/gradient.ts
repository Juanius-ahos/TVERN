// Pure, framework-agnostic helper: a deterministic gradient from an address.
// Lives in lib (not a "use client" component) so server components can call it.

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
