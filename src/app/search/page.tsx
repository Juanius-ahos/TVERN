import { prisma } from "@/lib/db";
import { KNOWN_TICKERS } from "@/lib/registry";
import { readSession } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { TopSearch } from "@/components/TopSearch";
import { shortAddr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 64);
  const bare = q.replace(/^[$@]/, "");
  const up = bare.toUpperCase();
  const isAddr = /^0x[0-9a-fA-F]{4,40}$/.test(q);
  const session = await readSession();

  let users: {
    address: string;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    followers: number;
  }[] = [];
  let posts: FeedPost[] = [];
  let assets: { symbol: string; isStock: boolean; posts: number }[] = [];

  if (bare) {
    const [rawUsers, rawPosts, symbolRows] = await Promise.all([
      prisma.user.findMany({
        where: isAddr
          ? { address: { contains: q.toLowerCase() } }
          : {
              OR: [
                { username: { contains: bare, mode: "insensitive" } },
                { bio: { contains: bare, mode: "insensitive" } },
              ],
            },
        take: 20,
        orderBy: { followers: { _count: "desc" } },
        select: {
          address: true,
          username: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { followers: true } },
        },
      }),
      prisma.post.findMany({
        where: { parentId: null, body: { contains: bare, mode: "insensitive" } },
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { address: true, username: true, avatarUrl: true } },
          event: { select: { id: true, title: true, assetSymbol: true, kind: true } },
          _count: { select: { likes: true, reposts: true, replies: true } },
          likes: session ? { where: { userId: session.userId }, select: { id: true } } : false,
          reposts: session ? { where: { userId: session.userId }, select: { id: true } } : false,
        },
      }),
      prisma.event.groupBy({
        by: ["assetSymbol"],
        where: { assetSymbol: { contains: bare, mode: "insensitive" } },
        _count: { assetSymbol: true },
        orderBy: { _count: { assetSymbol: "desc" } },
        take: 20,
      }),
    ]);

    users = rawUsers.map((u) => ({
      address: u.address,
      username: u.username,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      followers: u._count.followers,
    }));

    posts = rawPosts.map((p) => ({
      type: "post",
      id: p.id,
      body: p.body,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      author: p.author,
      event: p.event,
      createdAt: p.createdAt.toISOString(),
      likeCount: p._count.likes,
      repostCount: p._count.reposts,
      replyCount: p._count.replies,
      likedByMe: Array.isArray(p.likes) ? p.likes.length > 0 : false,
      repostedByMe: Array.isArray(p.reposts) ? p.reposts.length > 0 : false,
    }));

    const assetMap = new Map<string, { symbol: string; isStock: boolean; posts: number }>();
    for (const r of symbolRows) {
      const sym = r.assetSymbol.toUpperCase();
      assetMap.set(sym, { symbol: sym, isStock: KNOWN_TICKERS.has(sym), posts: r._count.assetSymbol });
    }
    for (const t of KNOWN_TICKERS) {
      if (up && t.includes(up) && !assetMap.has(t)) assetMap.set(t, { symbol: t, isStock: true, posts: 0 });
    }
    assets = [...assetMap.values()].sort((a, b) => b.posts - a.posts).slice(0, 20);
  }

  const total = users.length + posts.length + assets.length;

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="mb-2.5 text-[19px] font-bold tracking-tight">
          {q ? <>Results for “{q}”</> : "Search"}
        </h1>
        <TopSearch autoFocus={!q} />
      </header>

      {!q ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          Search people, posts, and $tickers across Robinhood Chain.
        </div>
      ) : total === 0 ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          Nothing found for “{q}”.
        </div>
      ) : (
        <div className="space-y-6 px-4 py-4">
          {assets.length > 0 && (
            <section>
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Assets</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {assets.map((a) => (
                  <a
                    key={a.symbol}
                    href={`/asset/${a.symbol}`}
                    className="card-hover flex items-center gap-3 rounded-2xl border hairline p-3"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--accent)]/12 text-[15px] font-bold text-[var(--accent)]">
                      $
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[15px] font-bold">
                        ${a.symbol}
                        {a.isStock && (
                          <span className="rounded bg-[color:var(--accent)]/15 px-1 text-[10px] font-bold text-[var(--accent)]">
                            STOCK
                          </span>
                        )}
                      </span>
                      <span className="text-[12px] text-[var(--muted)]">
                        {a.posts > 0 ? `${a.posts} mention${a.posts === 1 ? "" : "s"}` : "on Robinhood Chain"}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {users.length > 0 && (
            <section>
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">People</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.address} className="card-hover flex items-center gap-3 rounded-2xl border hairline p-3">
                    <a href={`/wallet/${u.address}`}>
                      <Avatar address={u.address} src={u.avatarUrl} size={44} />
                    </a>
                    <a href={`/wallet/${u.address}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">
                        {u.username ?? shortAddr(u.address)}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--muted)]">
                        {u.username ? shortAddr(u.address) : "wallet"}
                        {u.followers > 0 ? ` · ${u.followers} follower${u.followers === 1 ? "" : "s"}` : ""}
                      </span>
                      {u.bio && <span className="mt-0.5 line-clamp-1 text-[13px] text-[var(--text)]/80">{u.bio}</span>}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Posts</h2>
              <div className="space-y-3">
                {posts.map((p) => (
                  <PostCard key={p.id} p={p} canPost={!!session} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
