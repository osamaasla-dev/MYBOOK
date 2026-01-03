import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import {
  ensureNotAlreadyFollowing,
  ensureNotBlocked,
} from "../../utils/guards";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "../../utils/realtime";
import { createFollowNotification } from "./followNotifications";
import { FollowNotificationPayload } from "../../types";

export type FollowPublicProfileInput = {
  viewerId: string;
  viewerUsername: string;
  viewerName: string;
  targetUserId: string;
  targetUsername: string;
  targetName: string;
};

export async function followProfile({
  viewerId,
  viewerUsername,
  viewerName,
  targetUserId,
  targetUsername,
  targetName,
  requiresApproval,
}: FollowPublicProfileInput & { requiresApproval: boolean }) {
  if (viewerId === targetUserId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  await ensureNotBlocked(viewerId, targetUserId);
  await ensureNotAlreadyFollowing(viewerId, targetUserId);

  let needsApproval = requiresApproval;

  if (needsApproval) {
    const [targetAlreadyFollowsViewer, existingFriendship] = await Promise.all([
      prisma.follow.findFirst({
        where: { followerId: targetUserId, followingId: viewerId },
        select: { id: true },
      }),
      prisma.friend.findFirst({
        where: {
          OR: [
            { userOneId: viewerId, userTwoId: targetUserId },
            { userOneId: targetUserId, userTwoId: viewerId },
          ],
        },
        select: { id: true },
      }),
    ]);

    if (targetAlreadyFollowsViewer || existingFriendship) {
      needsApproval = false;
    }
  }

  if (needsApproval) {
    const followRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.followRequest.upsert({
        where: {
          requesterId_receiverId: {
            requesterId: viewerId,
            receiverId: targetUserId,
          },
        },
        update: {
          status: "PENDING",
          respondedAt: null,
        },
        create: {
          requesterId: viewerId,
          receiverId: targetUserId,
          status: "PENDING",
        },
        select: { id: true },
      });

      const notificationId = await createFollowNotification(tx, {
        followerId: viewerId,
        followerUsername: viewerUsername,

        targetUserId,
        targetUsername,
        followId: null,
        kind: "follow-request",
        status: "pending",
      });

      if (notificationId) {
        await tx.followRequest.update({
          where: { id: request.id },
          data: { notificationId },
        });
      }

      return request;
    });

    await broadcastFollowEvent({
      event: "follow:requested",
      followerId: viewerId,
      followerUsername: viewerUsername,
      followerName: viewerName,
      targetId: targetUserId,
      targetUsername,
      targetName,
      kind: "follow-request",
      followersDelta: 0,
      requestId: followRequest.id,
    });

    return {
      status: "REQUESTED",
      requestId: followRequest.id,
    } as const;
  }

  const notificationPayload: FollowNotificationPayload = {
    followerId: viewerId,
    followerUsername: viewerUsername,

    targetUserId,
    targetUsername,
    kind: "follow",
    status: "accepted",
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

      await createFollowNotification(tx, {
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
    followerName: viewerName,
    targetId: targetUserId,
    targetUsername,
    targetName,
    kind: "follow",
    followersDelta: 1,
  });

  return {
    status: "FOLLOWED",
  } as const;
}
