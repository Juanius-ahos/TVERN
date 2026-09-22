import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extractCashtags } from "@/lib/assets";

export const dynamic = "force-dynamic";

type PosterRow = {
  id: string;
  address: string;
  username: string | null;
  avatarUrl: string | null;
  followers: number;
  posts: number;
  likes: number;
  reposts: number;
  replies: number;
};

export async function GET() {
  const [rows, recent] = await Promise.all([
    prisma.$queryRaw<PosterRow[]>(Prisma.sql`
      SELECT u.id, u.address, u.username, u."avatarUrl",
        (SELECT COUNT(*)::int FROM "Follow" f WHERE f."followingId" = u.id) AS followers,
        (SELECT COUNT(*)::int FROM "Post" p WHERE p."authorId" = u.id AND p."parentId" IS NULL) AS posts,
        (SELECT COUNT(*)::int FROM "Like" l JOIN "Post" p ON l."postId" = p.id WHERE p."authorId" = u.id) AS likes,
        (SELECT COUNT(*)::int FROM "Repost" r JOIN "Post" p ON r."postId" = p.id WHERE p."authorId" = u.id) AS reposts,
        (SELECT COUNT(*)::int FROM "Post" c JOIN "Post" p ON c."parentId" = p.id WHERE p."authorId" = u.id) AS replies
      FROM "User" u
      WHERE EXISTS (SELECT 1 FROM "Post" p WHERE p."authorId" = u.id AND p."parentId" IS NULL)
      LIMIT 300
    `),
    prisma.post.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { body: true },
    }),
  ]);

  const topPosters = rows
    .map((r) => ({
      row: r,
      score: r.posts * 2 + r.followers * 4 + r.likes * 2 + r.reposts * 5 + r.replies * 3,
    }))
    .sort((a, b) => b.score - a.score || b.row.followers - a.row.followers)
    .slice(0, 10)
    .map(({ row, score }) => ({
      address: row.address,
      username: row.username,
      avatarUrl: row.avatarUrl,
      posts: row.posts,
      followers: row.followers,
      engagement: row.likes + row.reposts + row.replies,
      score,
    }));

  // Trending cashtags from the last week of posts.
  const counts = new Map<string, number>();
  for (const p of recent) {
    for (const tag of extractCashtags(p.body)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const trendingTags = [...counts.entries()]
    .map(([symbol, mentions]) => ({ symbol, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  return NextResponse.json({ topPosters, trendingTags });
}
