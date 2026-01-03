import { FriendRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { createFriendNotification } from "./friendNotifications";

export type UpsertPendingFriendRequestArgs = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function upsertPendingFriendRequest({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: UpsertPendingFriendRequestArgs) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.friendRequest.upsert({
      where: {
        requesterId_receiverId: {
          requesterId: viewerId,
          receiverId: targetUserId,
        },
      },
      update: {
        status: FriendRequestStatus.PENDING,
        respondedAt: null,
      },
      create: {
        requesterId: viewerId,
        receiverId: targetUserId,
        status: FriendRequestStatus.PENDING,
      },
      select: { id: true, notificationId: true },
    });

    const notificationPayload = {
      requesterId: viewerId,
      requesterUsername: viewerUsername,
      targetUserId,
      targetUsername,
      requestId: request.id,
      kind: "friend-request" as const,
      status: "pending" as const,
    };

    const notificationId = await createFriendNotification(
      tx,
      notificationPayload
    );

    if (notificationId) {
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { notificationId },
      });
      return { ...request, notificationId };
    }

    if (request.notificationId) {
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { notificationId: null },
      });
      return { ...request, notificationId: null };
    }

    return request;
  });
}
