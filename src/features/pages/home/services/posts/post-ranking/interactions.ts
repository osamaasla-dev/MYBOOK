import { prisma } from "@/lib/prisma";

import type { PostInteractionFlags } from "@/features/pages/home/utils/posts/post-ranking";

export const createEmptyInteractionFlags = (): PostInteractionFlags => ({
  hasLiked: false,
  hasCommented: false,
  hasShared: false,
});

export async function fetchViewerPostInteractions(
  viewerId: string,
  postIds: string[]
) {
  const interactions = new Map<string, PostInteractionFlags>();
  if (!viewerId || !postIds.length) {
    return interactions;
  }

  const [likes, comments, shares] = await Promise.all([
    prisma.postReaction.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
    prisma.comment.findMany({
      where: {
        authorId: viewerId,
        postId: { in: postIds },
        isDeleted: false,
      },
      select: { postId: true },
    }),
    prisma.postShare.findMany({
      where: { sharedById: viewerId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ]);

  for (const reaction of likes) {
    const next =
      interactions.get(reaction.postId) ?? createEmptyInteractionFlags();
    next.hasLiked = true;
    interactions.set(reaction.postId, next);
  }

  for (const comment of comments) {
    const next =
      interactions.get(comment.postId) ?? createEmptyInteractionFlags();
    next.hasCommented = true;
    interactions.set(comment.postId, next);
  }

  for (const share of shares) {
    const next =
      interactions.get(share.postId) ?? createEmptyInteractionFlags();
    next.hasShared = true;
    interactions.set(share.postId, next);
  }

  return interactions;
}
