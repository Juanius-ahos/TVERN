import { NextResponse } from "next/server";
import { getTradesForSymbol } from "@/lib/registry";

export const dynamic = "force-dynamic";

// GET → live trade tape for a token (newest first).
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const trades = await getTradesForSymbol(symbol.toUpperCase());
  return NextResponse.json({ trades }, { headers: { "cache-control": "no-store" } });
}
