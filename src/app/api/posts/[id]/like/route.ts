import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: session.userId, postId: id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: session.userId, postId: id } });
  }

  const count = await prisma.like.count({ where: { postId: id } });
  return NextResponse.json({ liked: !existing, count });
}
