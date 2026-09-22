import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PostCard, type FeedPost } from "@/components/PostCard";
import { ReloadComposer } from "@/components/ReloadComposer";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof loadPost>>;

async function loadPost(id: string, userId?: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { address: true, username: true, avatarUrl: true } },
      event: { select: { id: true, title: true, assetSymbol: true, kind: true } },
      _count: { select: { likes: true, reposts: true, replies: true } },
      likes: userId ? { where: { userId }, select: { id: true } } : false,
      reposts: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });
}

function toFeedPost(p: NonNullable<Row>): FeedPost {
  return {
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
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const userId = session?.userId;

  const post = await loadPost(id, userId);
  if (!post) notFound();

  const [parent, replyRows] = await Promise.all([
    post.parentId ? loadPost(post.parentId, userId) : Promise.resolve(null),
    prisma.post.findMany({
      where: { parentId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        author: { select: { address: true, username: true, avatarUrl: true } },
        event: { select: { id: true, title: true, assetSymbol: true, kind: true } },
        _count: { select: { likes: true, reposts: true, replies: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
        reposts: userId ? { where: { userId }, select: { id: true } } : false,
      },
    }),
  ]);

  const replies = replyRows.map((r) => toFeedPost(r as NonNullable<Row>));

  return (
    <div>
      <header className="sticky top-11 z-20 flex items-center gap-3 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <BackButton />
        <h1 className="text-[19px] font-bold tracking-tight">Thread</h1>
      </header>

      <div className="space-y-3 px-4 py-3">
        {parent && (
          <div className="relative">
            <PostCard p={toFeedPost(parent)} canPost={!!session} />
            <div className="ml-9 h-3 border-l-2 hairline" />
          </div>
        )}

        <PostCard p={toFeedPost(post)} canPost={!!session} />

        {session ? (
          <ReloadComposer
            parentId={id}
            placeholder="Post your reply…"
            submitLabel="Reply"
          />
        ) : (
          <a
            href="/login"
            className="block rounded-2xl border hairline p-4 text-center text-[14px] text-[var(--muted)] transition hover:bg-white/[0.03]"
          >
            Sign in to reply
          </a>
        )}

        <div className="pt-1">
          {replies.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-[var(--muted)]">No replies yet — be the first.</div>
          ) : (
            <div className="space-y-3">
              {replies.map((r) => (
                <PostCard key={r.id} p={r} canPost={!!session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
