import type { Prisma } from "@prisma/client";
import type { FeedPost } from "@/components/PostCard";
import { isDev } from "@/lib/roles";

/**
 * Shared Prisma `include` for loading a post with everything PostCard needs.
 * Pass the viewer's id to hydrate their like/repost/bookmark/vote state.
 */
export function postInclude(myId?: string): Prisma.PostInclude {
  const mine = myId ? { where: { userId: myId }, select: { id: true } } : false;
  return {
    author: { select: { address: true, username: true, avatarUrl: true } },
    event: { select: { id: true, title: true, assetSymbol: true, kind: true } },
    community: { select: { slug: true, name: true } },
    _count: { select: { likes: true, reposts: true, replies: true } },
    likes: mine,
    reposts: mine,
    bookmarks: mine,
    poll: {
      include: {
        options: {
          orderBy: { idx: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        votes: myId ? { where: { userId: myId }, select: { optionId: true } } : false,
      },
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPost(p: any): FeedPost {
  const poll = p.poll
    ? {
        id: p.poll.id as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (p.poll.options as any[]).map((o) => ({
          id: o.id as string,
          text: o.text as string,
          votes: o._count.votes as number,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalVotes: (p.poll.options as any[]).reduce((s: number, o) => s + o._count.votes, 0),
        myOptionId:
          Array.isArray(p.poll.votes) && p.poll.votes.length ? (p.poll.votes[0].optionId as string) : null,
      }
    : null;

  return {
    type: "post",
    id: p.id,
    body: p.body,
    mediaUrl: p.mediaUrl,
    mediaType: p.mediaType,
    author: { ...p.author, isDev: isDev(p.author) },
    event: p.event,
    community: p.community ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    likeCount: p._count.likes,
    repostCount: p._count.reposts,
    replyCount: p._count.replies,
    likedByMe: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    repostedByMe: Array.isArray(p.reposts) ? p.reposts.length > 0 : false,
    bookmarkedByMe: Array.isArray(p.bookmarks) ? p.bookmarks.length > 0 : false,
    poll,
  };
}
