import { FriendRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { friendMessages } from "@/lib/messages";
import { ensureNotBlocked } from "@/features/parts/follow/utils/guards";

import { throwFriendError } from "./friendshipErrors";

export type FriendshipEligibilityArgs = {
  viewerId: string;
  targetUserId: string;
};

export async function assertFriendshipEligibility({
  viewerId,
  targetUserId,
}: FriendshipEligibilityArgs) {
  if (viewerId === targetUserId) {
    throwFriendError(friendMessages.FRIEND_ERRORS.selfFriend);
  }

  await ensureNotBlocked(viewerId, targetUserId);

  const [existingFriendship, outgoingRequest, incomingRequest] =
    await Promise.all([
      prisma.friend.findFirst({
        where: {
          OR: [
            { userOneId: viewerId, userTwoId: targetUserId },
            { userOneId: targetUserId, userTwoId: viewerId },
          ],
        },
        select: { id: true },
      }),
      prisma.friendRequest.findFirst({
        where: {
          requesterId: viewerId,
          receiverId: targetUserId,
          status: FriendRequestStatus.PENDING,
        },
        select: { id: true },
      }),
      prisma.friendRequest.findFirst({
        where: {
          requesterId: targetUserId,
          receiverId: viewerId,
          status: FriendRequestStatus.PENDING,
        },
        select: { id: true },
      }),
    ]);

  if (existingFriendship) {
    throwFriendError(friendMessages.FRIEND_ERRORS.alreadyFriends);
  }

  if (outgoingRequest) {
    throwFriendError(friendMessages.FRIEND_ERRORS.outgoingRequestPending);
  }

  if (incomingRequest) {
    throwFriendError(friendMessages.FRIEND_ERRORS.incomingRequestPending);
  }
}
