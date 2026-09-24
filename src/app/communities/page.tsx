import { prisma } from "@/lib/db";
import { CreateCommunity } from "@/components/CreateCommunity";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const rows = await prisma.community.findMany({
    orderBy: { members: { _count: "desc" } },
    take: 100,
    include: { _count: { select: { members: true, posts: true } } },
  });

  return (
    <div>
      <header className="sticky top-11 z-20 border-b hairline bg-[var(--bg)]/85 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-[19px] font-bold tracking-tight">Communities</h1>
        <p className="text-[13px] text-[var(--muted)]">Rooms for the corners of Robinhood Chain</p>
      </header>

      <div className="space-y-4 px-4 py-4">
        <CreateCommunity />

        {rows.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[var(--muted)]">
            No communities yet, start the first one.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((c) => (
              <a
                key={c.slug}
                href={`/c/${c.slug}`}
                className="card-hover rounded-2xl border hairline p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--accent)]/12 text-[17px] font-bold text-[var(--accent-text)]">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">{c.name}</div>
                    <div className="text-[12px] text-[var(--muted)]">
                      {c._count.members} member{c._count.members === 1 ? "" : "s"} · {c._count.posts} posts
                    </div>
                  </div>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-[13px] text-[var(--text)]/80">{c.description}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
