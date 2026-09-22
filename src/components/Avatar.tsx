// Custom PFP when set, otherwise a smooth deterministic gradient from the address.
import { gradientFor } from "@/lib/gradient";

export { gradientFor };

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
