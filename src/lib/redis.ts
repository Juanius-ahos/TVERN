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

export async function bustCache(key: string) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}
