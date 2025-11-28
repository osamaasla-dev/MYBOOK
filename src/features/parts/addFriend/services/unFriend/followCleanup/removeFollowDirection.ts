import type { Prisma } from "@prisma/client";

import type { RemoveFollowDirectionInput } from "./types";

export async function removeFollowDirection(
  tx: Prisma.TransactionClient,
  { followerId, targetId }: RemoveFollowDirectionInput
): Promise<boolean> {
  const followRecord = await tx.follow.findFirst({
    where: { followerId, followingId: targetId },
    select: { id: true },
  });

  if (!followRecord) {
    return false;
  }

  await tx.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId: targetId,
      },
    },
  });

  await Promise.all([
    tx.user.update({
      where: { id: targetId },
      data: { followersCount: { decrement: 1 } },
    }),
    tx.user.update({
      where: { id: followerId },
      data: { followingCount: { decrement: 1 } },
    }),
  ]);

  return true;
}
