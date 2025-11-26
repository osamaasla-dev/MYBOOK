import { FriendRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import { updateFriendNotification } from "./friendNotifications";

export type CancelFriendRequestInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function cancelFriendRequest({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: CancelFriendRequestInput) {
  if (viewerId === targetUserId) {
    throw new Error(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  const requestId = await prisma.$transaction(async (tx) => {
    const pendingRequest = await tx.friendRequest.findFirst({
      where: {
        requesterId: viewerId,
        receiverId: targetUserId,
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
        status: FriendRequestStatus.CANCELED,
        respondedAt: new Date(),
      },
    });

    if (pendingRequest.notificationId) {
      await updateFriendNotification(tx, pendingRequest.notificationId, {
        requesterId: viewerId,
        requesterUsername: viewerUsername,
        targetUserId,
        targetUsername,
        requestId: pendingRequest.id,
        kind: "friend-request-canceled",
        status: "canceled",
      });
    }

    return pendingRequest.id;
  });

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFriendEvent({
    event: "friend:canceled",
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
    kind: "friend-request-canceled",
    requestId,
  });

  return {
    status: "CANCELED" as const,
    requestId,
  };
}
