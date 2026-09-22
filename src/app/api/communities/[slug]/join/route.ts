import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST → toggle membership in the community, returns { joined, members }
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { slug } = await params;

  const community = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
  if (!community) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await prisma.membership.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: session.userId } },
  });
  if (existing) {
    await prisma.membership.delete({ where: { id: existing.id } });
  } else {
    await prisma.membership.create({ data: { communityId: community.id, userId: session.userId } });
  }

  const members = await prisma.membership.count({ where: { communityId: community.id } });
  return NextResponse.json({ joined: !existing, members });
}
