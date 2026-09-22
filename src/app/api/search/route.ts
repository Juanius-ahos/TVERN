import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNOWN_TICKERS } from "@/lib/registry";

export const dynamic = "force-dynamic";

export type SearchUser = {
  address: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followers: number;
};

export type SearchPost = {
  id: string;
  body: string;
  createdAt: string;
  author: { address: string; username: string | null; avatarUrl: string | null };
  likeCount: number;
};

export type SearchAsset = {
  symbol: string;
  isStock: boolean;
  posts: number;
};

export type SearchResults = {
  users: SearchUser[];
  posts: SearchPost[];
  assets: SearchAsset[];
};

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 8), 20);
  const empty: SearchResults = { users: [], posts: [], assets: [] };
  if (!raw) return NextResponse.json(empty);

  const q = raw.slice(0, 64);
  const bare = q.replace(/^[$@]/, "");
  const isAddr = /^0x[0-9a-fA-F]{4,40}$/.test(q);

  const [users, posts, symbolRows] = await Promise.all([
    prisma.user.findMany({
      where: isAddr
        ? { address: { contains: q.toLowerCase() } }
        : {
            OR: [
              { username: { contains: bare, mode: "insensitive" } },
              { bio: { contains: bare, mode: "insensitive" } },
            ],
          },
      take: limit,
      orderBy: { followers: { _count: "desc" } },
      select: {
        address: true,
        username: true,
        avatarUrl: true,
        bio: true,
        _count: { select: { followers: true } },
      },
    }),
    prisma.post.findMany({
      where: { parentId: null, body: { contains: bare, mode: "insensitive" } },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { address: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.event.groupBy({
      by: ["assetSymbol"],
      where: { assetSymbol: { contains: bare, mode: "insensitive" } },
      _count: { assetSymbol: true },
      orderBy: { _count: { assetSymbol: "desc" } },
      take: limit,
    }),
  ]);

  // Merge indexed symbols with known tickers that match the query.
  const up = bare.toUpperCase();
  const assetMap = new Map<string, SearchAsset>();
  for (const r of symbolRows) {
    const sym = r.assetSymbol.toUpperCase();
    assetMap.set(sym, { symbol: sym, isStock: KNOWN_TICKERS.has(sym), posts: r._count.assetSymbol });
  }
  if (up) {
    for (const t of KNOWN_TICKERS) {
      if (t.includes(up) && !assetMap.has(t)) assetMap.set(t, { symbol: t, isStock: true, posts: 0 });
    }
  }
  const assets = [...assetMap.values()].sort((a, b) => b.posts - a.posts).slice(0, limit);

  const results: SearchResults = {
    users: users.map((u) => ({
      address: u.address,
      username: u.username,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      followers: u._count.followers,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      body: p.body,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      likeCount: p._count.likes,
    })),
    assets,
  };
  return NextResponse.json(results);
}
