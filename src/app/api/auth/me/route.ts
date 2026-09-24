import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { isDev } from "@/lib/roles";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, address: true, username: true, bio: true, avatarUrl: true, bannerUrl: true, website: true },
  });
  return NextResponse.json({ user: user ? { ...user, isDev: isDev(user) } : null });
}
