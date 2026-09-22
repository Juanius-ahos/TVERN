import { prisma } from "./db";

type NotifType = "LIKE" | "REPOST" | "REPLY" | "FOLLOW";

/**
 * Create a notification for `userId`, triggered by `actorId`.
 * No-ops when the actor is the recipient (don't notify yourself).
 */
export async function notify(opts: {
  userId: string;
  actorId: string;
  type: NotifType;
  postId?: string | null;
}) {
  if (!opts.userId || opts.userId === opts.actorId) return;
  try {
    await prisma.notification.create({
      data: {
        userId: opts.userId,
        actorId: opts.actorId,
        type: opts.type,
        postId: opts.postId ?? null,
      },
    });
  } catch {
    // notifications are best-effort; never block the primary action
  }
}
