import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { ensureNotAlreadyFollowing, ensureNotBlocked } from "../utils/guards";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "@/features/utils/realtime";
import { FollowNotificationPayload } from "../../notifications/types";
import { upsertFollowNotification } from "../../notifications/services";

export type FollowPublicProfileInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function followPublicProfile({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: FollowPublicProfileInput) {
  if (viewerId === targetUserId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  await ensureNotBlocked(viewerId, targetUserId);
  await ensureNotAlreadyFollowing(viewerId, targetUserId);

  const notificationPayload: FollowNotificationPayload = {
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetUserId,
    targetUsername,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const followRecord = await tx.follow.create({
        data: {
          followerId: viewerId,
          followingId: targetUserId,
        },
        select: { id: true },
      });

      await tx.user.update({
        where: { id: targetUserId },
        data: { followersCount: { increment: 1 } },
      });

      await tx.user.update({
        where: { id: viewerId },
        data: { followingCount: { increment: 1 } },
      });

      await upsertFollowNotification(tx, {
        ...notificationPayload,
        followId: followRecord.id,
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(followMessages.FOLLOW_ERRORS.alreadyFollowing);
    }

    throw error;
  }

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:added",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
  });

  return {
    status: "FOLLOWED",
  } as const;
}
