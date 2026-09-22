import { NextResponse } from "next/server";
import { getNewPools, getTrendingPools } from "@/lib/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gt = "https://api.geckoterminal.com/api/v2/networks/robinhood/new_pools?include=base_token,quote_token";
    const raw = await fetch(gt, { headers: { accept: "application/json" } });
    const rawStatus = raw.status;
    const rawJson = await raw.json().catch(() => null);
    const rawCount = rawJson?.data?.length ?? -1;

    const np = await getNewPools();
    const tp = await getTrendingPools();
    return NextResponse.json({
      rawStatus,
      rawCount,
      firstName: rawJson?.data?.[0]?.attributes?.name ?? null,
      newPools: np.length,
      trending: tp.length,
      sampleNew: np[0] ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
