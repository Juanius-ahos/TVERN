import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET → { symbols: string[] } for the signed-in user
export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ symbols: [] });
  const rows = await prisma.watch.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { symbol: true },
  });
  return NextResponse.json({ symbols: rows.map((r) => r.symbol) });
}

// POST { symbol } → toggle watch, returns { watching }
export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const { symbol } = await req.json().catch(() => ({}));
  const sym = String(symbol ?? "")
    .replace(/^\$/, "")
    .toUpperCase()
    .slice(0, 12);
  if (!sym) return NextResponse.json({ error: "no symbol" }, { status: 400 });

  const existing = await prisma.watch.findUnique({
    where: { userId_symbol: { userId: session.userId, symbol: sym } },
  });
  if (existing) {
    await prisma.watch.delete({ where: { id: existing.id } });
    return NextResponse.json({ watching: false });
  }
  await prisma.watch.create({ data: { userId: session.userId, symbol: sym } });
  return NextResponse.json({ watching: true });
}
