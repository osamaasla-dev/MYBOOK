import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFollowEvent } from "@/features/parts/follow/utils/realtime";
import { FollowSyncResult } from "./followSync/types";
import { broadcastFriendEvent } from "../../../utils";

export type EventsBroadcasterArgs = {
  viewerId: string;
  viewerUsername: string;
  viewerName: string;
  requesterId: string;
  requesterUsername: string;
  requesterName: string;
  followResults: FollowSyncResult[];
  friendRequestId: string;
};

export async function broadcastAcceptanceEvents({
  viewerId,
  viewerUsername,
  viewerName,
  requesterId,
  requesterUsername,
  requesterName,
  followResults,
  friendRequestId,
}: EventsBroadcasterArgs) {
  const followApprovedEvents = followResults
    .filter((result) => Boolean(result.acceptedRequestId))
    .map((result) =>
      broadcastFollowEvent({
        event: "follow:approved",
        followerId: result.targetId,
        followerName: result.targetName,
        followerUsername: result.targetUsername,
        targetId: result.followerId,
        targetUsername: result.followerUsername,
        targetName: result.followerName,
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
        followerName: result.followerName,
        followerUsername: result.followerUsername,
        targetId: result.targetId,
        targetName: result.targetName,
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
    requesterName: viewerName,
    targetId: requesterId,
    targetUsername: requesterUsername,
    targetName: requesterName,
    kind: "friend-request-accepted",
    requestId: friendRequestId,
  });
}
