import type { Prisma } from "@prisma/client";

import type { UnFriendInput } from "../unFriend";
import { friendMessages } from "@/lib/messages";

export async function handleFriendRemoval(
  tx: Prisma.TransactionClient,
  { viewerId, targetUserId }: UnFriendInput
) {
  const [userOneId, userTwoId] =
    viewerId < targetUserId
      ? [viewerId, targetUserId]
      : [targetUserId, viewerId];

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
}
