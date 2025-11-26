import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import { deleteFriendNotification } from "./friendNotifications";

export type RemoveFriendInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function removeFriend({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
}: RemoveFriendInput) {
  if (viewerId === targetUserId) {
    throw new Error(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  const [userOneId, userTwoId] =
    viewerId < targetUserId
      ? [viewerId, targetUserId]
      : [targetUserId, viewerId];

  try {
    const { notificationId } = await prisma.$transaction(async (tx) => {
      const friendship = await tx.friend.findUnique({
        where: {
          userOneId_userTwoId: {
            userOneId,
            userTwoId,
          },
        },
        select: { id: true },
      });

      if (!friendship) {
        throw new Error(friendMessages.FRIEND_ERRORS.notFriends);
      }

      const friendRequest = await tx.friendRequest.findFirst({
        where: {
          OR: [
            {
              requesterId: viewerId,
              receiverId: targetUserId,
            },
            {
              requesterId: targetUserId,
              receiverId: viewerId,
            },
          ],
          status: "ACCEPTED",
        },
        select: { notificationId: true },
      });

      await tx.friend.delete({
        where: {
          userOneId_userTwoId: {
            userOneId,
            userTwoId,
          },
        },
      });

      await Promise.all([
        tx.user.update({
          where: { id: viewerId },
          data: { friendsCount: { decrement: 1 } },
        }),
        tx.user.update({
          where: { id: targetUserId },
          data: { friendsCount: { decrement: 1 } },
        }),
      ]);

      return { notificationId: friendRequest?.notificationId ?? null };
    });

    if (notificationId) {
      try {
        await prisma.$transaction((tx) =>
          deleteFriendNotification(tx, notificationId)
        );
      } catch {
        // Ignore notification cleanup errors
      }
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(friendMessages.FRIEND_ERRORS.notFriends);
    }

    throw error;
  }

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(targetUsername),
  ]);

  await broadcastFriendEvent({
    event: "friend:remove",
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    targetId: targetUserId,
    targetUsername,
    kind: "friend-remove",
    requestId: "",
  });

  return {
    status: "REMOVED" as const,
  };
}
