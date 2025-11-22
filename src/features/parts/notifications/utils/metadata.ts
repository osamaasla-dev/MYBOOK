import type {
  FollowNotificationMetadata,
  FollowNotificationPayload,
  PrismaTransaction,
} from "../types";

export async function buildFollowNotificationMetadata(
  tx: PrismaTransaction,
  payload: FollowNotificationPayload
): Promise<FollowNotificationMetadata> {
  const [follower, target] = await Promise.all([
    tx.user.findUnique({
      where: { id: payload.followerId },
      select: { name: true },
    }),
    tx.user.findUnique({
      where: { id: payload.targetUserId },
      select: { name: true },
    }),
  ]);

  return {
    followerUsername: payload.followerUsername,
    followerName: follower?.name ?? null,
    targetUsername: payload.targetUsername,
    targetName: target?.name ?? null,
    occurredAt: new Date().toISOString(),
  };
}
