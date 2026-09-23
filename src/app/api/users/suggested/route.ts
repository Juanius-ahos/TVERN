import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Row = {
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

/**
 * "Who to follow", real people only, ranked by activity + engagement.
 * A user must have posted at least once (no empty/idle wallets recommended).
 * Score rewards being active (posts) and, more heavily, earning engagement
 * (likes, reposts, replies) and building an audience (followers).
 */
export async function GET() {
  const session = await readSession();

  // Exclude yourself and anyone you already follow.
  const exclude = session
    ? Prisma.sql`AND u.id <> ${session.userId}
        AND u.id NOT IN (SELECT "followingId" FROM "Follow" WHERE "followerId" = ${session.userId})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT u.id, u.address, u.username, u."avatarUrl",
      (SELECT COUNT(*)::int FROM "Follow" f WHERE f."followingId" = u.id) AS followers,
      (SELECT COUNT(*)::int FROM "Post" p WHERE p."authorId" = u.id AND p."parentId" IS NULL) AS posts,
      (SELECT COUNT(*)::int FROM "Like" l JOIN "Post" p ON l."postId" = p.id WHERE p."authorId" = u.id) AS likes,
      (SELECT COUNT(*)::int FROM "Repost" r JOIN "Post" p ON r."postId" = p.id WHERE p."authorId" = u.id) AS reposts,
      (SELECT COUNT(*)::int FROM "Post" c JOIN "Post" p ON c."parentId" = p.id WHERE p."authorId" = u.id) AS replies
    FROM "User" u
    WHERE EXISTS (SELECT 1 FROM "Post" p WHERE p."authorId" = u.id AND p."parentId" IS NULL)
    ${exclude}
    LIMIT 200
  `);

  const scored = rows
    .map((r) => ({
      row: r,
      // Engagement earned is weighted above raw activity.
      score: r.posts * 2 + r.followers * 4 + r.likes * 2 + r.reposts * 5 + r.replies * 3,
    }))
    .sort((a, b) => b.score - a.score || b.row.followers - a.row.followers)
    .slice(0, 6);

  const users = scored.map(({ row }) => ({
    id: row.id,
    address: row.address,
    username: row.username,
    avatarUrl: row.avatarUrl,
    _count: { followers: row.followers },
  }));

  return NextResponse.json({ users });
}
