import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";

import { broadcastFollowEvent } from "../utils";
import {
  createFollowNotification,
  updateFollowNotification,
} from "./followNotifications";

export type AcceptFollowRequestInput = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

export async function acceptFollowRequest({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
}: AcceptFollowRequestInput) {
  if (viewerId === requesterId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  const { requestId } = await prisma.$transaction(async (tx) => {
    const pendingRequest = await tx.followRequest.findFirst({
      where: {
        requesterId,
        receiverId: viewerId,
        status: "PENDING",
      },
      select: { id: true, notificationId: true },
    });

    if (!pendingRequest) {
      throw new Error(followMessages.FOLLOW_ERRORS.noPendingRequest);
    }

    await tx.followRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });

    await tx.follow.create({
      data: {
        followerId: requesterId,
        followingId: viewerId,
      },
    });

    await tx.user.update({
      where: { id: viewerId },
      data: { followersCount: { increment: 1 } },
    });

    await tx.user.update({
      where: { id: requesterId },
      data: { followingCount: { increment: 1 } },
    });

    if (pendingRequest.notificationId) {
      await updateFollowNotification(tx, pendingRequest.notificationId, {
        followerId: requesterId,
        followerUsername: requesterUsername,
        targetUserId: viewerId,
        targetUsername: viewerUsername,
        followId: null,
        kind: "follow-request",
        status: "accepted",
      });
    }

    await createFollowNotification(tx, {
      followerId: viewerId,
      followerUsername: viewerUsername,
      targetUserId: requesterId,
      targetUsername: requesterUsername,
      followId: null,
      kind: "follow-request-approved",
    });

    return { requestId: pendingRequest.id };
  });

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(requesterUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:approved",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: requesterId,
    targetUsername: requesterUsername,
    kind: "follow-request-approved",
    followersDelta: 0,
    requestId,
  });

  await broadcastFollowEvent({
    event: "follow:added",
    followerId: requesterId,
    followerUsername: requesterUsername,
    targetId: viewerId,
    targetUsername: viewerUsername,
    kind: "follow",
    followersDelta: 1,
  });

  return {
    status: "APPROVED" as const,
    requestId,
  };
}
