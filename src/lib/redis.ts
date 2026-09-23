import { Redis } from "@upstash/redis";

// Upstash Redis for feed caching + rate limiting. Null (disabled) when env is unset,
// so the app runs fine locally without it.
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Cache helper: read JSON, or compute + store with a short TTL.
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  if (!redis) return compute();
  try {
    const hit = await redis.get<T>(key);
    if (hit != null) return hit;
  } catch {
    /* fall through */
  }
  const val = await compute();
  try {
    await redis.set(key, val, { ex: ttlSeconds });
  } catch {
    /* ignore cache write errors */
  }
  return val;
}

// A tiny per-instance L1 so bursts of requests on one warm lambda don't all hit Redis.
const mem = new Map<string, { at: number; val: unknown }>();
// Per-instance last-known-good — survives even when Redis isn't configured, so a
// single rate-limited GeckoTerminal call never blanks the UI once we've seen data.
const lkgMem = new Map<string, unknown>();

/**
 * Live-data cache with last-known-good fallback.
 * - Serves a fresh value from Redis (shared across all serverless instances).
 * - On a miss, computes; if the result is non-empty it's cached (short TTL) AND
 *   kept as "last known good" for an hour.
 * - If the upstream fails or returns empty (e.g. GeckoTerminal rate-limits us),
 *   it serves the last known good instead of blanking the UI.
 */
export async function liveCached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  isEmpty: (v: T) => boolean
): Promise<T> {
  const now = Date.now();
  const l1 = mem.get(key);
  if (l1 && now - l1.at < ttlSeconds * 1000) return l1.val as T;

  if (redis) {
    try {
      const hit = await redis.get<T>(key);
      if (hit != null && !isEmpty(hit)) {
        mem.set(key, { at: now, val: hit });
        return hit;
      }
    } catch {
      /* fall through */
    }
  }

  let val: T | undefined;
  try {
    val = await compute();
  } catch {
    val = undefined;
  }

  if (val !== undefined && !isEmpty(val)) {
    mem.set(key, { at: now, val });
    lkgMem.set(key, val); // remember the last good value on this instance
    if (redis) {
      try {
        await redis.set(key, val, { ex: ttlSeconds });
        await redis.set(`${key}:lkg`, val, { ex: 3600 }); // last known good (shared)
      } catch {
        /* ignore */
      }
    }
    return val;
  }

  // Upstream failed or came back empty — serve the last good value we have.
  if (redis) {
    try {
      const lkg = await redis.get<T>(`${key}:lkg`);
      if (lkg != null && !isEmpty(lkg)) {
        mem.set(key, { at: now, val: lkg });
        lkgMem.set(key, lkg);
        return lkg;
      }
    } catch {
      /* ignore */
    }
  }
  const localLkg = lkgMem.get(key) as T | undefined;
  if (localLkg !== undefined) return localLkg;
  return (val ?? ([] as unknown as T)) as T;
}

export async function bustCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}
