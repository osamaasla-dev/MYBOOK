import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { invalidateProfileCache } from "@/features/pages/profile/utils";

import { followMessages } from "@/lib/messages";
import { broadcastFollowEvent, ensureCurrentlyFollowing } from "../../utils";

export type UnfollowProfileInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function unfollowProfile({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: UnfollowProfileInput) {
  if (viewerId === targetUserId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  const followId = await ensureCurrentlyFollowing(viewerId, targetUserId);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({ where: { id: followId } });

      await tx.user.update({
        where: { id: targetUserId },
        data: { followersCount: { decrement: 1 } },
      });

      await tx.user.update({
        where: { id: viewerId },
        data: { followingCount: { decrement: 1 } },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(followMessages.FOLLOW_ERRORS.notFollowing);
    }

    throw error;
  }

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:removed",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
    kind: "unfollow",
    followersDelta: -1,
  });

  return {
    status: "UNFOLLOWED",
  } as const;
}
