import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();

  const users = await prisma.user.findMany({
    where: session ? { id: { not: session.userId } } : {},
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      address: true,
      username: true,
      avatarUrl: true,
      _count: { select: { followers: true } },
    },
  });

  return NextResponse.json({ users });
}
