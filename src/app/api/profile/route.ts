import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { username, bio, avatarUrl, bannerUrl, website } = await req.json().catch(() => ({}));
  const data: {
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    website?: string | null;
  } = {};

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
  if (bannerUrl !== undefined) data.bannerUrl = bannerUrl ? String(bannerUrl) : null;
  if (website !== undefined) {
    let w = String(website).trim().slice(0, 100);
    if (w && !/^https?:\/\//i.test(w)) w = `https://${w}`;
    if (w && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(w)) {
      return NextResponse.json({ error: "invalid website URL" }, { status: 400 });
    }
    data.website = w || null;
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, address: true, username: true, bio: true, avatarUrl: true, bannerUrl: true, website: true },
  });

  return NextResponse.json({ user });
}
