import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { ReloadComposer } from "@/components/ReloadComposer";
import { BackButton } from "@/components/BackButton";
import { postInclude, mapPost } from "@/lib/feedPost";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const userId = session?.userId;

  const post = await prisma.post.findUnique({ where: { id }, include: postInclude(userId) });
  if (!post) notFound();

  const [parent, replyRows] = await Promise.all([
    post.parentId
      ? prisma.post.findUnique({ where: { id: post.parentId }, include: postInclude(userId) })
      : Promise.resolve(null),
    prisma.post.findMany({
      where: { parentId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: postInclude(userId),
    }),
  ]);

  const replies = replyRows.map(mapPost);

  return (
    <div>
      <header className="sticky top-11 z-20 flex items-center gap-3 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <BackButton />
        <h1 className="text-[19px] font-bold tracking-tight">Thread</h1>
      </header>

      <div className="space-y-3 px-4 py-3">
        {parent && (
          <div className="relative">
            <PostCard p={mapPost(parent)} canPost={!!session} />
            <div className="ml-9 h-3 border-l-2 hairline" />
          </div>
        )}

        <PostCard p={mapPost(post)} canPost={!!session} />

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
