import { FollowRequestStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type {
  CancelFollowRequestDirectionInput,
  CanceledFollowRequest,
} from "./types";
import { updateFollowNotification } from "@/features/parts/follow/services/server";

export async function cancelFollowRequestDirection(
  tx: Prisma.TransactionClient,
  {
    requesterId,
    requesterUsername,
    receiverId,
    receiverUsername,
  }: CancelFollowRequestDirectionInput
): Promise<CanceledFollowRequest | null> {
  const request = await tx.followRequest.findFirst({
    where: {
      requesterId,
      receiverId,
      status: FollowRequestStatus.PENDING,
    },
    select: { id: true, notificationId: true },
  });

  if (!request) {
    return null;
  }

  await tx.followRequest.update({
    where: { id: request.id },
    data: {
      status: FollowRequestStatus.CANCELED,
      respondedAt: new Date(),
    },
  });

  if (request.notificationId) {
    await updateFollowNotification(tx, request.notificationId, {
      followerId: requesterId,
      followerUsername: requesterUsername,
      targetUserId: receiverId,
      targetUsername: receiverUsername,
      followId: null,
      kind: "follow-request",
      status: "canceled",
    });
  }

  return {
    requesterId,
    requesterUsername,
    receiverId,
    receiverUsername,
    requestId: request.id,
  };
}
