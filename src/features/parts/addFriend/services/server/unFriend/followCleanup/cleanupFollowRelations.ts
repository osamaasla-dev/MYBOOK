import type { Prisma } from "@prisma/client";

import type { UnFriendInput } from "../../unFriend";
import type { FollowCleanupResult } from "./types";
import { removeFollowDirection } from "./removeFollowDirection";
import { cancelFollowRequestDirection } from "./cancelFollowRequestDirection";

export async function cleanupFollowRelations(
  tx: Prisma.TransactionClient,
  { viewerId, viewerUsername, targetUserId, targetUsername }: UnFriendInput
): Promise<FollowCleanupResult> {
  const removedFollows: FollowCleanupResult["removedFollows"] = [];
  const canceledRequests: FollowCleanupResult["canceledRequests"] = [];

  if (
    await removeFollowDirection(tx, {
      followerId: viewerId,
      targetId: targetUserId,
    })
  ) {
    removedFollows.push({
      followerId: viewerId,
      followerUsername: viewerUsername,
      targetId: targetUserId,
      targetUsername,
    });
  }

  if (
    await removeFollowDirection(tx, {
      followerId: targetUserId,
      targetId: viewerId,
    })
  ) {
    removedFollows.push({
      followerId: targetUserId,
      followerUsername: targetUsername,
      targetId: viewerId,
      targetUsername: viewerUsername,
    });
  }

  const viewerRequest = await cancelFollowRequestDirection(tx, {
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    receiverId: targetUserId,
    receiverUsername: targetUsername,
  });

  if (viewerRequest) {
    canceledRequests.push(viewerRequest);
  }

  const targetRequest = await cancelFollowRequestDirection(tx, {
    requesterId: targetUserId,
    requesterUsername: targetUsername,
    receiverId: viewerId,
    receiverUsername: viewerUsername,
  });

  if (targetRequest) {
    canceledRequests.push(targetRequest);
  }

  return { removedFollows, canceledRequests };
}
