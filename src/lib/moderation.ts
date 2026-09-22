import { prisma } from "./db";

/**
 * Author ids whose content should be hidden from `userId`'s feed:
 * anyone they muted, anyone they blocked, and anyone who blocked them.
 */
export async function getHiddenAuthorIds(userId: string): Promise<string[]> {
  const [mutes, blocking, blockedBy] = await Promise.all([
    prisma.mute.findMany({ where: { muterId: userId }, select: { mutedId: true } }),
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);
  const ids = new Set<string>();
  for (const m of mutes) ids.add(m.mutedId);
  for (const b of blocking) ids.add(b.blockedId);
  for (const b of blockedBy) ids.add(b.blockerId);
  return [...ids];
}
