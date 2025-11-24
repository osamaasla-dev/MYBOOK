import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "@/features/utils/realtime";
import { deleteFollowNotification } from "../../notifications/services";

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

    await tx.followRequest.delete({ where: { id: pendingRequest.id } });
    if (pendingRequest.notificationId) {
      await deleteFollowNotification(tx, pendingRequest.notificationId);
    }

    return pendingRequest.id;
  });

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:rejected",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
    kind: "follow-request-rejected",
    followersDelta: 0,
    requestId,
  });

  return {
    status: "CANCELLED",
    requestId,
  } as const;
}
