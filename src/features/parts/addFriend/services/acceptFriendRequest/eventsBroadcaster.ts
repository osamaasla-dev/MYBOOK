import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../../utils/realtime";
import { broadcastFollowEvent } from "@/features/parts/follow/utils/realtime";
import { FollowSyncResult } from "./followSync/types";

export type EventsBroadcasterArgs = {
  viewerId: string;
  viewerUsername: string;
  requesterId: string;
  requesterUsername: string;
  followResults: FollowSyncResult[];
  friendRequestId: string;
};

export async function broadcastAcceptanceEvents({
  viewerId,
  viewerUsername,
  requesterId,
  requesterUsername,
  followResults,
  friendRequestId,
}: EventsBroadcasterArgs) {
  const followApprovedEvents = followResults
    .filter((result) => Boolean(result.acceptedRequestId))
    .map((result) =>
      broadcastFollowEvent({
        event: "follow:approved",
        followerId: result.targetId,
        followerUsername: result.targetUsername,
        targetId: result.followerId,
        targetUsername: result.followerUsername,
        kind: "follow-request-approved",
        followersDelta: 0,
        requestId: result.acceptedRequestId,
      })
    );

  const followAddedEvents = followResults
    .filter((result) => result.createdFollow)
    .map((result) =>
      broadcastFollowEvent({
        event: "follow:added",
        followerId: result.followerId,
        followerUsername: result.followerUsername,
        targetId: result.targetId,
        targetUsername: result.targetUsername,
        kind: "follow",
        followersDelta: 1,
      })
    );

  await Promise.all([
    invalidateProfileCache(requesterUsername),
    invalidateProfileCache(viewerUsername),
    ...followApprovedEvents,
    ...followAddedEvents,
  ]);

  await broadcastFriendEvent({
    event: "friend:accepted",
    requesterId: viewerId,
    requesterUsername: viewerUsername,
    targetId: requesterId,
    targetUsername: requesterUsername,
    kind: "friend-request-accepted",
    requestId: friendRequestId,
  });
}
