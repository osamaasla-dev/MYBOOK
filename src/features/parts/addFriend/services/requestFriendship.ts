import { invalidateProfileCache } from "@/features/pages/profile/utils";
import { broadcastFriendEvent } from "../utils/realtime";
import { assertFriendshipEligibility } from "./friendshipPrechecks";
import { upsertPendingFriendRequest } from "./friendshipRequestPersistence";

export type RequestFriendshipInput = {
  viewerId: string;
  viewerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export async function requestFriendship({
  viewerId,
  viewerUsername,
  targetUserId,
  targetUsername,
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
    requesterUsername: viewerUsername,
    targetId: targetUserId,
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
