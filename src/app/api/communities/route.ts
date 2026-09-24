import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

// GET → list communities (most members first)
export async function GET() {
  const rows = await prisma.community.findMany({
    orderBy: { members: { _count: "desc" } },
    take: 100,
    include: { _count: { select: { members: true, posts: true } } },
  });
  return NextResponse.json({
    communities: rows.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      iconUrl: c.iconUrl,
      members: c._count.members,
      posts: c._count.posts,
    })),
  });
}

// POST { name, description } → create a community, creator becomes admin member
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const rl = await checkRateLimit(`community:${session.userId}`, 5, "1 h");
  if (!rl.ok) return NextResponse.json({ error: "slow down, too many communities" }, { status: 429 });

  const { name, description } = await req.json().catch(() => ({}));
  const cleanName = String(name ?? "").trim().slice(0, 40);
  if (cleanName.length < 2) return NextResponse.json({ error: "name too short" }, { status: 400 });

  let slug = slugify(cleanName);
  if (!slug) return NextResponse.json({ error: "invalid name" }, { status: 400 });

  // Ensure unique slug.
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const community = await prisma.community.create({
    data: {
      slug,
      name: cleanName,
      description: String(description ?? "").trim().slice(0, 300) || null,
      creatorId: session.userId,
      members: { create: { userId: session.userId, role: "admin" } },
    },
  });

  return NextResponse.json({ slug: community.slug });
}
