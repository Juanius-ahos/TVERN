import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { isDev } from "@/lib/roles";

export const dynamic = "force-dynamic";

// DELETE a post/comment. Authors can delete their own; devs/moderators can
// delete anything. Cascades to replies, likes, reposts.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (post.authorId !== session.userId) {
    const me = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, address: true },
    });
    if (!isDev(me)) {
      return NextResponse.json({ error: "not your post" }, { status: 403 });
    }
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
