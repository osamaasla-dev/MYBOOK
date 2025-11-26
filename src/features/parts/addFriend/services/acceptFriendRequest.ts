import { FriendRequestStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import {
  createFriendNotification,
  updateFriendNotification,
} from "./friendNotifications";

export type AcceptFriendRequestInput = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
};

export async function acceptFriendRequest({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
}: AcceptFriendRequestInput) {
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
        status: FriendRequestStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    const [userOneId, userTwoId] =
      viewerId < requesterId
        ? [viewerId, requesterId]
        : [requesterId, viewerId];

    let createdFriendRecord = false;

    try {
      await tx.friend.create({
        data: {
          userOneId,
          userTwoId,
        },
      });
      createdFriendRecord = true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        createdFriendRecord = false;
      } else {
        throw error;
      }
    }

    if (createdFriendRecord) {
      await Promise.all([
        tx.user.update({
          where: { id: viewerId },
          data: { friendsCount: { increment: 1 } },
        }),
        tx.user.update({
          where: { id: requesterId },
          data: { friendsCount: { increment: 1 } },
        }),
      ]);
    }

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
  });

  await Promise.all([
    invalidateProfileCache(requesterUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  await broadcastFriendEvent({
    event: "friend:accepted",
    requesterId: viewerId,
    requesterUsername,
    targetId: requesterId,
    targetUsername: requesterUsername,
    kind: "friend-request-accepted",
    requestId,
  });

  return {
    status: "ACCEPTED" as const,
    requestId,
  };
}
