import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.repost.findUnique({
    where: { userId_postId: { userId: session.userId, postId: id } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    await prisma.repost.create({ data: { userId: session.userId, postId: id } });
    const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
    if (post) await notify({ userId: post.authorId, actorId: session.userId, type: "REPOST", postId: id });
  }

  const count = await prisma.repost.count({ where: { postId: id } });
  return NextResponse.json({ reposted: !existing, count });
}
