import { FriendRequestStatus, type Prisma } from "@prisma/client";

import { friendMessages } from "@/lib/messages";

import {
  createFriendNotification,
  updateFriendNotification,
} from "../friendNotifications";

export type FriendRequestHandlerArgs = {
  viewerId: string;
  viewerUsername: string;

  requesterId: string;
  requesterUsername: string;
};

export async function handleFriendRequestAcceptance(
  tx: Prisma.TransactionClient,
  {
    viewerId,
    viewerUsername,
    requesterId,
    requesterUsername,
  }: FriendRequestHandlerArgs
) {
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
      status: FriendRequestStatus.ACCEPTED,
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
      status: "accepted",
    });
  }

  await createFriendNotification(tx, {
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    targetUserId: requesterId,
    targetUsername: requesterUsername,
    requestId: pendingRequest.id,
    kind: "friend-request-accepted",
    status: "accepted",
  });

  return { requestId: pendingRequest.id };
}
