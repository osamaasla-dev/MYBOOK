import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import { assertFriendshipEligibility } from "./friendshipPrechecks";
import { upsertPendingFriendRequest } from "./friendshipRequestPersistence";

export type RequestFriendshipInput = {
  viewerId: string;
  viewerUsername: string;
  viewerName?: string;
  targetUserId: string;
  targetUsername: string;
  targetName?: string;
};

export async function requestFriendship({
  viewerId,
  viewerUsername,
  viewerName,
  targetUserId,
  targetUsername,
  targetName,
}: RequestFriendshipInput) {
  await assertFriendshipEligibility({ viewerId, targetUserId });

  const friendRequest = await upsertPendingFriendRequest({
    viewerId,
    viewerUsername,
    targetUserId,
    targetUsername,
  });

  await broadcastFriendEvent({
    event: "friend:request",
    requesterId: viewerId,
    requesterName: viewerName,
    requesterUsername: viewerUsername,
    targetId: targetUserId,
    targetName,
    targetUsername,
    kind: "friend-request",
    requestId: friendRequest.id,
  });

  await Promise.all([
    invalidateProfileCache(targetUsername),
    invalidateProfileCache(viewerUsername),
  ]);

  return {
    status: "REQUESTED" as const,
    requestId: friendRequest.id,
  };
}
