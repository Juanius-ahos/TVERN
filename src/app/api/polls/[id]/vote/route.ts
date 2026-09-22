import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST { optionId } → records the vote (one per poll per user), returns tallies.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "sign in first" }, { status: 401 });
  const { id: pollId } = await params;
  const { optionId } = await req.json().catch(() => ({}));

  const option = await prisma.pollOption.findFirst({
    where: { id: String(optionId ?? ""), pollId },
    select: { id: true },
  });
  if (!option) return NextResponse.json({ error: "invalid option" }, { status: 400 });

  // One vote per user per poll; ignore if they already voted.
  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: session.userId } },
  });
  if (!existing) {
    await prisma.pollVote.create({
      data: { pollId, optionId: option.id, userId: session.userId },
    });
  }

  const options = await prisma.pollOption.findMany({
    where: { pollId },
    orderBy: { idx: "asc" },
    include: { _count: { select: { votes: true } } },
  });
  const mapped = options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes }));
  const totalVotes = mapped.reduce((s, o) => s + o.votes, 0);
  const myOptionId = existing ? existing.optionId : option.id;

  return NextResponse.json({ options: mapped, totalVotes, myOptionId });
}
