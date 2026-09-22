import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { postInclude, mapPost } from "@/lib/feedPost";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const session = await readSession();

  if (!session) {
    return (
      <div>
        <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
          <h1 className="text-[19px] font-bold tracking-tight">Bookmarks</h1>
        </header>
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          <a href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </a>{" "}
          to save posts for later.
        </div>
      </div>
    );
  }

  const rows = await prisma.bookmark.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { post: { include: postInclude(session.userId) } },
  });
  const posts = rows.map((r) => mapPost(r.post));

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Bookmarks</h1>
        <p className="text-[13px] text-[var(--muted)]">Posts you saved</p>
      </header>

      {posts.length === 0 ? (
        <div className="px-4 py-12 text-center text-[14px] text-[var(--muted)]">
          Nothing saved yet. Tap the bookmark icon on any post to keep it here.
        </div>
      ) : (
        <div className="space-y-3 px-4 py-3">
          {posts.map((p) => (
            <PostCard key={p.id} p={p} canPost />
          ))}
        </div>
      )}
    </div>
  );
}
