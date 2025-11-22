import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";

export async function ensureNotBlocked(viewerId: string, targetUserId: string) {
  const [viewerBlockingTarget, targetBlockingViewer] = await Promise.all([
    prisma.block.findFirst({
      where: { blockerId: viewerId, blockedId: targetUserId },
      select: { id: true },
    }),
    prisma.block.findFirst({
      where: { blockerId: targetUserId, blockedId: viewerId },
      select: { id: true },
    }),
  ]);

  if (viewerBlockingTarget || targetBlockingViewer) {
    throw new Error(followMessages.FOLLOW_ERRORS.blocked);
  }
}

export async function ensureNotAlreadyFollowing(
  viewerId: string,
  targetUserId: string
) {
  const followRecord = await prisma.follow.findFirst({
    where: { followerId: viewerId, followingId: targetUserId },
    select: { id: true },
  });

  if (followRecord) {
    throw new Error(followMessages.FOLLOW_ERRORS.alreadyFollowing);
  }
}

export async function ensureCurrentlyFollowing(
  viewerId: string,
  targetUserId: string
) {
  const followRecord = await prisma.follow.findFirst({
    where: { followerId: viewerId, followingId: targetUserId },
    select: { id: true },
  });

  if (!followRecord) {
    throw new Error(followMessages.FOLLOW_ERRORS.notFollowing);
  }

  return followRecord.id;
}
