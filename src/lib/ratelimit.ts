import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { redis } from "./redis";

// One limiter per (limit, window) combo. No-ops when Upstash isn't configured.
const limiters = new Map<string, Ratelimit>();

export async function checkRateLimit(
  key: string,
  limit: number,
  window: Duration
): Promise<{ ok: boolean }> {
  if (!redis) return { ok: true };
  const id = `${limit}:${window}`;
  let rl = limiters.get(id);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: "tavern-rl",
      analytics: false,
    });
    limiters.set(id, rl);
  }
  try {
    const r = await rl.limit(key);
    return { ok: r.success };
  } catch {
    return { ok: true }; // never block on limiter failure
  }
}
