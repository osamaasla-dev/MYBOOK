import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { friendMessages } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

import { acceptFriendRequest } from "@/features/parts/addFriend/services";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { updateRankedPostRelationships } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { prepareFriendAction, type FriendRouteContext } from "../shared";

const ROUTE = "/api/add-friend/[username]/accept-request";

export async function POST(request: Request, { params }: FriendRouteContext) {
  const preparation = await prepareFriendAction(request, params, ROUTE);

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerName, viewerUsername, target } =
    preparation.context;

  try {
    const result = await acceptFriendRequest({
      viewerId,
      viewerUsername,
      viewerName,
      requesterId: target.id,
      requesterUsername: target.username,
      requesterName: target.name,
    });

    await prisma.$transaction(async (tx) => {
      await adjustRelationshipSnapshot({
        actorId: viewerId,
        targetUserId: target.id,
        isFriend: true,
        isFollowing: true,
        prismaClient: tx,
      });
      await adjustRelationshipSnapshot({
        actorId: target.id,
        targetUserId: viewerId,
        isFriend: true,
        isFollowing: true,
        prismaClient: tx,
      });
    });

    await Promise.all([
      updateRankedPostRelationships({
        viewerId,
        authorId: target.id,
        isFriend: true,
        isFollowing: true,
      }),
      updateRankedPostRelationships({
        viewerId: target.id,
        authorId: viewerId,
        isFriend: true,
        isFollowing: true,
      }),
    ]);

    return apiResponse(
      true,
      result,
      friendMessages.FEEDBACK.acceptRequestSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Accept friend request failed");

    return apiResponse(
      false,
      {},
      error.message ?? friendMessages.FEEDBACK.acceptRequestFailure,
      error.status ?? 500,
      requestId
    );
  }
}
