import { FollowRequestStatus, Prisma } from "@prisma/client";

import type { FollowSyncArgs, FollowSyncResult } from "./types";
import {
  updateFollowNotification,
  createFollowNotification,
} from "@/features/parts/follow/services/server";

export async function syncFollowDirection(
  tx: Prisma.TransactionClient,
  {
    followerId,
    followerUsername,
    followerName,
    targetId,
    targetUsername,
    targetName,
  }: FollowSyncArgs
): Promise<FollowSyncResult> {
  let acceptedRequestId: string | undefined;

  const pendingRequest = await tx.followRequest.findFirst({
    where: {
      requesterId: followerId,
      receiverId: targetId,
      status: FollowRequestStatus.PENDING,
    },
    select: { id: true, notificationId: true },
  });

  if (pendingRequest) {
    await tx.followRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: FollowRequestStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    acceptedRequestId = pendingRequest.id;

    if (pendingRequest.notificationId) {
      await updateFollowNotification(tx, pendingRequest.notificationId, {
        followerId,
        followerUsername,
        targetUserId: targetId,
        targetUsername,
        followId: null,
        kind: "follow-request",
        status: "accepted",
      });
    }

    await createFollowNotification(tx, {
      followerId: targetId,
      followerUsername: targetUsername,
      targetUserId: followerId,
      targetUsername: followerUsername,
      followId: null,
      kind: "follow-request-approved",
    });
  }

  let createdFollow = false;

  const existingFollow = await tx.follow.findFirst({
    where: {
      followerId,
      followingId: targetId,
    },
    select: { id: true },
  });

  if (!existingFollow) {
    try {
      await tx.follow.create({
        data: {
          followerId,
          followingId: targetId,
        },
      });
      createdFollow = true;

      await Promise.all([
        tx.user.update({
          where: { id: targetId },
          data: { followersCount: { increment: 1 } },
        }),
        tx.user.update({
          where: { id: followerId },
          data: { followingCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        createdFollow = false;
      } else {
        throw error;
      }
    }
  }

  return {
    followerId,
    followerUsername,
    followerName,
    targetId,
    targetUsername,
    targetName,
    createdFollow,
    acceptedRequestId,
  };
}
