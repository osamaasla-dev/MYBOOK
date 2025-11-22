import type { PrismaTransaction } from "../types";

export async function isFollowNotificationBlocked(
  tx: PrismaTransaction,
  followerId: string,
  targetUserId: string
): Promise<boolean> {
  const blocked = await tx.block.findFirst({
    where: { blockerId: targetUserId, blockedId: followerId },
    select: { id: true },
  });

  return Boolean(blocked);
}
