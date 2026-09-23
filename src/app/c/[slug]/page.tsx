import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { ReloadComposer } from "@/components/ReloadComposer";
import { JoinButton } from "@/components/JoinButton";
import { postInclude, mapPost } from "@/lib/feedPost";

export const dynamic = "force-dynamic";

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await readSession();

  const community = await prisma.community.findUnique({
    where: { slug },
    include: { _count: { select: { members: true, posts: true } } },
  });
  if (!community) notFound();

  const [membership, rawPosts] = await Promise.all([
    session
      ? prisma.membership.findUnique({
          where: { communityId_userId: { communityId: community.id, userId: session.userId } },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.post.findMany({
      where: { communityId: community.id, parentId: null },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: postInclude(session?.userId),
    }),
  ]);

  const posts = rawPosts.map(mapPost);
  const joined = !!membership;

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[color:var(--accent)]/12 text-[19px] font-bold text-[var(--accent-text)]">
              {community.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h1 className="text-[19px] font-bold tracking-tight">{community.name}</h1>
              <p className="text-[13px] text-[var(--muted)]">
                {community._count.members} member{community._count.members === 1 ? "" : "s"} ·{" "}
                {community._count.posts} posts
              </p>
            </div>
          </div>
          <JoinButton slug={community.slug} initialJoined={joined} />
        </div>
        {community.description && (
          <p className="mt-2 text-[14px] text-[var(--text)]/85">{community.description}</p>
        )}
      </header>

      <div className="space-y-3 px-4 py-3">
        {joined ? (
          <ReloadComposer communityId={community.id} placeholder={`Post to ${community.name}…`} />
        ) : (
          <div className="rounded-2xl border hairline p-4 text-center text-[14px] text-[var(--muted)]">
            {session ? "Join this community to post." : (
              <>
                <a href="/login" className="font-semibold text-[var(--accent-text)] hover:underline">Sign in</a> and join to post.
              </>
            )}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="py-10 text-center text-[14px] text-[var(--muted)]">
            No posts yet. {joined ? "Say the first thing." : "Join and get it started."}
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} p={p} canPost={!!session} />)
        )}
      </div>
    </div>
  );
}
