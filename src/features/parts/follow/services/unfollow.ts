import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { invalidateProfileCache } from "@/features/pages/profile/utils";

import { followMessages } from "@/lib/messages";
import { broadcastFollowEvent } from "@/features/utils/realtime";
import { ensureCurrentlyFollowing } from "../utils";
import { deleteFollowNotification } from "../../notifications/services";

export type UnfollowPublicProfileInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function unfollowPublicProfile({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: UnfollowPublicProfileInput) {
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

      await deleteFollowNotification(tx, viewerId, targetUserId);
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
  });

  return {
    status: "UNFOLLOWED",
  } as const;
}
