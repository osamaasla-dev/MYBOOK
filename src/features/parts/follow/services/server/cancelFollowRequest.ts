import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "../../utils";
import { updateFollowNotification } from "./followNotifications";

export type CancelFollowRequestInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function cancelFollowRequest({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: CancelFollowRequestInput) {
  if (viewerId === targetUserId) {
    throw new Error(followMessages.FOLLOW_ERRORS.selfFollow);
  }

  const requestId = await prisma.$transaction(async (tx) => {
    const pendingRequest = await tx.followRequest.findFirst({
      where: {
        requesterId: viewerId,
        receiverId: targetUserId,
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
        status: "CANCELED",
        respondedAt: new Date(),
      },
    });

    if (pendingRequest.notificationId) {
      await updateFollowNotification(tx, pendingRequest.notificationId, {
        followerId: viewerId,
        followerUsername: viewerUsername,
        targetUserId,
        targetUsername,
        kind: "follow-request",
        status: "canceled",
      });
    }

    return pendingRequest.id;
  });

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:canceled",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
    kind: "follow-request-canceled",
    followersDelta: 0,
    requestId,
  });

  return {
    status: "CANCELLED",
    requestId,
  } as const;
}
