import type {
  FriendNotificationMetadata,
  FriendNotificationPayload,
  PrismaTransaction,
} from "../types";

export async function buildFriendNotificationMetadata(
  tx: PrismaTransaction,
  payload: FriendNotificationPayload
): Promise<FriendNotificationMetadata> {
  const [requester, target] = await Promise.all([
    tx.user.findUnique({
      where: { id: payload.requesterId },
      select: { name: true },
    }),
    tx.user.findUnique({
      where: { id: payload.targetUserId },
      select: { name: true },
    }),
  ]);

  return {
    requesterUsername: payload.requesterUsername,
    requesterName: requester?.name ?? null,
    targetUsername: payload.targetUsername,
    targetName: target?.name ?? null,
    occurredAt: new Date().toISOString(),
    kind: payload.kind,
    status: payload.status,
    requestId: payload.requestId,
  };
}
