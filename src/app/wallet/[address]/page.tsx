import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { Avatar, gradientFor } from "@/components/Avatar";
import { EditProfile } from "@/components/EditProfile";
import { TipButton } from "@/components/TipButton";
import { FollowUserButton } from "@/components/FollowUserButton";
import { PostMenu } from "@/components/PostMenu";
import { ProfileTabs } from "@/components/ProfileTabs";
import type { FeedPost } from "@/components/PostCard";
import type { FeedEvent } from "@/components/EventCard";
import { shortAddr } from "@/lib/format";
import { postInclude, mapPost } from "@/lib/feedPost";

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const addr = address.toLowerCase();
  const session = await readSession();
  const isMe = session?.address === addr;

  const user = await prisma.user.findUnique({
    where: { address: addr },
    select: {
      id: true,
      username: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });

  const [rawPosts, rawEvents, eventCount, firstEvent, isFollowing] = await Promise.all([
    user
      ? prisma.post.findMany({
          where: { authorId: user.id, parentId: null },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: postInclude(session?.userId),
        })
      : Promise.resolve([] as never[]),
    prisma.event.findMany({
      where: { OR: [{ fromAddr: addr }, { toAddr: addr }] },
      orderBy: { blockTs: "desc" },
      take: 30,
      include: { _count: { select: { posts: true } } },
    }),
    prisma.event.count({ where: { OR: [{ fromAddr: addr }, { toAddr: addr }] } }),
    prisma.event.findFirst({
      where: { OR: [{ fromAddr: addr }, { toAddr: addr }] },
      orderBy: { blockTs: "asc" },
      select: { blockTs: true },
    }),
    session && user
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: session.userId, followingId: user.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const posts: FeedPost[] = rawPosts.map(mapPost);

  const events: FeedEvent[] = rawEvents.map((e) => ({
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
    createdAt: e.blockTs.toISOString(),
    commentCount: e._count.posts,
  }));

  const name = user?.username ?? shortAddr(addr);
  const joined = user?.createdAt ?? firstEvent?.blockTs;

  return (
    <div>
      {/* header bar */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b hairline bg-[var(--bg)]/85 px-4 py-2 backdrop-blur-xl">
        <a href="/" className="text-[var(--muted)] hover:text-[var(--text)]">←</a>
        <div>
          <div className="text-[16px] font-bold leading-tight">{name}</div>
          <div className="text-[12px] text-[var(--muted)]">{eventCount} on-chain events</div>
        </div>
      </div>

      {/* banner */}
      <div className="h-36 w-full" style={{ backgroundImage: gradientFor(addr), opacity: 0.9 }} />

      {/* identity */}
      <div className="px-4">
        <div className="-mt-10 flex items-end justify-between">
          <div className="rounded-full ring-4 ring-[var(--bg)]">
            <Avatar address={addr} src={user?.avatarUrl} size={84} />
          </div>
          <div className="mb-1 flex items-center gap-2">
            {isMe ? (
              <EditProfile />
            ) : (
              <>
                {user && <FollowUserButton userId={user.id} initialFollowing={!!isFollowing} />}
                <TipButton recipient={addr} />
                <PostMenu authorAddress={addr} />
              </>
            )}
          </div>
        </div>

        <div className="mt-2">
          <h1 className="text-xl font-extrabold">{name}</h1>
          <p className="break-all font-mono text-[13px] text-[var(--muted)]">{addr}</p>
        </div>

        {user?.bio && <p className="mt-2 text-[15px] leading-normal">{user.bio}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--muted)]">
          {joined && <span>Joined {new Date(joined).toISOString().slice(0, 10)}</span>}
          {user && (
            <span className="rounded bg-[color:var(--accent)]/12 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
              on The Tavern
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-5 text-[14px]">
          <span>
            <span className="font-bold">{posts.length}</span> <span className="text-[var(--muted)]">Posts</span>
          </span>
          <span>
            <span className="font-bold">{user?._count.followers ?? 0}</span> <span className="text-[var(--muted)]">Followers</span>
          </span>
          <span>
            <span className="font-bold">{user?._count.following ?? 0}</span> <span className="text-[var(--muted)]">Following</span>
          </span>
        </div>
      </div>

      <div className="mt-4">
        <ProfileTabs posts={posts} events={events} canPost={!!session} />
      </div>
    </div>
  );
}
