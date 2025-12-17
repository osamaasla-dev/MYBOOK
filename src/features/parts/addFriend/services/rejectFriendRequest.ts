import { FriendRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import { updateFriendNotification } from "./friendNotifications";

export type RejectFriendRequestInput = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

export async function rejectFriendRequest({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
}: RejectFriendRequestInput) {
  if (viewerId === requesterId) {
    throw new Error(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  const { requestId } = await prisma.$transaction(async (tx) => {
    const pendingRequest = await tx.friendRequest.findFirst({
      where: {
        requesterId,
        receiverId: viewerId,
        status: FriendRequestStatus.PENDING,
      },
      select: { id: true, notificationId: true },
    });

    if (!pendingRequest) {
      throw new Error(friendMessages.FRIEND_ERRORS.noPendingRequest);
    }

    await tx.friendRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: FriendRequestStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    if (pendingRequest.notificationId) {
      await updateFriendNotification(tx, pendingRequest.notificationId, {
        requesterId,
        requesterUsername,
        targetUserId: viewerId,
        targetUsername: viewerUsername,
        requestId: pendingRequest.id,
        kind: "friend-request",
        status: "rejected",
      });
    }

    return { requestId: pendingRequest.id };
  });

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(requesterUsername),
  ]);

  await broadcastFriendEvent({
    event: "friend:rejected",
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    targetId: requesterId,
    targetUsername: requesterUsername,
    kind: "friend-request-rejected",
    requestId,
  });

  return {
    status: "REJECTED" as const,
    requestId,
  };
}
