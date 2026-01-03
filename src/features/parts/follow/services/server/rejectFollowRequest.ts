import { prisma } from "@/lib/prisma";
import { followMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "../../utils";
import { updateFollowNotification } from "./followNotifications";

export type RejectFollowRequestInput = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

export async function rejectFollowRequest({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
}: RejectFollowRequestInput) {
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
        status: "REJECTED",
        respondedAt: new Date(),
      },
    });
    if (pendingRequest.notificationId) {
      await updateFollowNotification(tx, pendingRequest.notificationId, {
        followerId: requesterId,
        followerUsername: requesterUsername,
        targetUserId: viewerId,
        targetUsername: viewerUsername,
        followId: null,
        kind: "follow-request",
        status: "rejected",
      });
    }

    return { requestId: pendingRequest.id };
  });

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(requesterUsername),
  ]);

  await broadcastFollowEvent({
    event: "follow:rejected",
    followerId: viewerId,
    followerUsername: viewerUsername,
    targetId: requesterId,
    targetUsername: requesterUsername,
    kind: "follow-request-rejected",
    followersDelta: 0,
    requestId,
  });

  return {
    status: "REJECTED" as const,
    requestId,
  };
}
