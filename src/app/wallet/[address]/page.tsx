import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { EventCard, type FeedEvent } from "@/components/EventCard";
import { FollowWalletButton } from "@/components/FollowWalletButton";
import { EditProfile } from "@/components/EditProfile";
import { TipButton } from "@/components/TipButton";
import { shortAddr } from "@/lib/format";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const addr = address.toLowerCase();
  const session = await readSession();

  const [events, user, firstEvent, eventCount] = await Promise.all([
    prisma.event.findMany({
      where: { OR: [{ fromAddr: addr }, { toAddr: addr }] },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { _count: { select: { posts: true } } },
    }),
    prisma.user.findUnique({
      where: { address: addr },
      select: { username: true, bio: true, avatarUrl: true, createdAt: true },
    }),
    prisma.event.findFirst({
      where: { OR: [{ fromAddr: addr }, { toAddr: addr }] },
      orderBy: { blockTs: "asc" },
      select: { blockTs: true },
    }),
    prisma.event.count({ where: { OR: [{ fromAddr: addr }, { toAddr: addr }] } }),
  ]);

  const items: FeedEvent[] = events.map((e) => ({
    type: "event",
    id: e.id,
    kind: e.kind,
    title: e.title,
    assetSymbol: e.assetSymbol,
    assetAddress: e.assetAddress,
    fromAddr: e.fromAddr,
    toAddr: e.toAddr,
    usdValue: e.usdValue,
    txHash: e.txHash,
    createdAt: e.createdAt.toISOString(),
    commentCount: e._count.posts,
  }));

  return (
    <div className="px-4 py-4">
      <div className="mb-6 flex items-start gap-4 rounded-2xl border hairline bg-[var(--panel)] p-5">
        <Avatar address={addr} src={user?.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate text-lg font-bold">
              {user?.username ?? shortAddr(addr)}
            </h1>
            {session?.address === addr ? (
              <EditProfile />
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <FollowWalletButton address={addr} />
                <TipButton recipient={addr} />
              </div>
            )}
          </div>
          <p className="mt-1 break-all font-mono text-xs text-neutral-500">{addr}</p>
          <div className="mt-3 flex gap-4 text-sm text-neutral-400">
            <span>
              <span className="font-semibold text-neutral-200">{eventCount}</span> events
            </span>
            {firstEvent && (
              <span>
                first seen{" "}
                <span className="font-semibold text-neutral-200">
                  {firstEvent.blockTs.toISOString().slice(0, 10)}
                </span>
              </span>
            )}
            {user && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-300">
                on WTF
              </span>
            )}
          </div>
          {user?.bio && <p className="mt-2 text-sm text-neutral-300">{user.bio}</p>}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-neutral-400">Activity</h2>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="py-8 text-center text-neutral-500">No indexed activity yet.</div>
        )}
        {items.map((e) => (
          <EventCard key={e.id} e={e} canPost={!!session} />
        ))}
      </div>
    </div>
  );
}
