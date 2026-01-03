import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "@/features/parts/follow/utils/realtime";

import type { UnFriendInput } from "../unFriend";
import type { FollowCleanupResult } from "./followCleanupHandler";
import { broadcastFriendEvent } from "../../../utils";

export type BroadcastRemovalArgs = UnFriendInput & {
  followResult: FollowCleanupResult;
};

export async function broadcastRemovalEvents({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
  followResult,
}: BroadcastRemovalArgs) {
  const followRemovalEvents = followResult.removedFollows.flatMap(
    ({ followerId, followerUsername, targetId, targetUsername }) => [
      broadcastFollowEvent({
        event: "follow:removed",
        followerId,
        followerUsername,
        targetId,
        targetUsername,
        kind: "unfollow",
        followersDelta: -1,
      }),
      broadcastFollowEvent({
        event: "follower:removed",
        followerId: targetId,
        followerUsername: targetUsername,
        targetId: followerId,
        targetUsername: followerUsername,
        kind: "follower-removed",
        followersDelta: 0,
      }),
    ]
  );

  const followCanceledEvents = followResult.canceledRequests.map(
    ({
      requesterId,
      requesterUsername,
      receiverId,
      receiverUsername,
      requestId,
    }) =>
      broadcastFollowEvent({
        event: "follow:canceled",
        followerId: requesterId,
        followerUsername: requesterUsername,
        targetId: receiverId,
        targetUsername: receiverUsername,
        kind: "follow-request-canceled",
        followersDelta: 0,
        requestId,
      })
  );

  await Promise.all([
    invalidateProfileCache(viewerUsername),
    invalidateProfileCache(targetUsername),
    ...followRemovalEvents,
    ...followCanceledEvents,
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
}
