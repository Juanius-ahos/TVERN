import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { username, bio, avatarUrl } = await req.json().catch(() => ({}));
  const data: { username?: string | null; bio?: string | null; avatarUrl?: string | null } = {};

  if (username !== undefined) {
    const u = String(username).trim();
    if (u) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(u)) {
        return NextResponse.json(
          { error: "username must be 3–20 chars: letters, numbers, underscore" },
          { status: 400 }
        );
      }
      const taken = await prisma.user.findFirst({
        where: { username: { equals: u }, NOT: { id: session.userId } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: "username taken" }, { status: 409 });
      data.username = u;
    } else {
      data.username = null;
    }
  }
  if (bio !== undefined) data.bio = String(bio).slice(0, 280) || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl ? String(avatarUrl) : null;

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, address: true, username: true, bio: true, avatarUrl: true },
  });

  return NextResponse.json({ user });
}
