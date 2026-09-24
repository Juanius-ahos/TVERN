import { prisma } from "./db";
import { redis } from "./redis";

// Retention for the live tape. The indexers write thousands of Event rows a day
// (every buy/sell/whale/launch on the chain), but the feed only ever reads the
// most recent ones. Without pruning, the Event table grows without bound and
// fills the Postgres store. We keep a rolling window and delete anything older,
// except events a user has quoted in a post (those are referenced and worth
// keeping) and recent launches (few in number, nice to keep a bit longer).

const RETENTION_DAYS = Number(process.env.EVENT_RETENTION_DAYS ?? 10);
const LAUNCH_RETENTION_DAYS = Number(process.env.LAUNCH_RETENTION_DAYS ?? 30);

export async function pruneOldEvents(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 864e5);
  const launchCutoff = new Date(Date.now() - LAUNCH_RETENTION_DAYS * 864e5);

  let deleted = 0;

  // Trades/whales/transfers older than the window, that nobody quoted.
  const trades = await prisma.event.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      kind: { not: "LAUNCH" },
      posts: { none: {} },
    },
    // Prisma deleteMany has no limit; Neon handles this fine, but cap churn by
    // only ever looking at the aged slice above.
  });
  deleted += trades.count;

  // Launches age out more slowly, and only once un-quoted.
  const launches = await prisma.event.deleteMany({
    where: {
      createdAt: { lt: launchCutoff },
      kind: "LAUNCH",
      posts: { none: {} },
    },
  });
  deleted += launches.count;

  return { deleted };
}

// Traffic-driven, self-throttled: at most one prune per hour across the fleet.
const PRUNE_INTERVAL = Number(process.env.PRUNE_SECONDS ?? 3600);
let lastLocalPrune = 0;

export async function maybePrune(): Promise<void> {
  const now = Date.now();
  if (redis) {
    try {
      const ok = await redis.set("prune:lock", now, { nx: true, ex: PRUNE_INTERVAL });
      if (ok !== "OK") return;
    } catch {
      return;
    }
  } else {
    if (now - lastLocalPrune < PRUNE_INTERVAL * 1000) return;
    lastLocalPrune = now;
  }
  try {
    await pruneOldEvents();
  } catch {
    // best-effort; retention is not on the critical path
  }
}
