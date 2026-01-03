import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { friendMessages } from "@/lib/messages";

import { unFriend } from "@/features/parts/addFriend/services/server";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { prepareFriendAction, type FriendRouteContext } from "../shared";
import { prisma } from "@/lib/prisma";

const ROUTE = "/api/add-friend/[username]/unfriend";

export async function DELETE(request: Request, { params }: FriendRouteContext) {
  const preparation = await prepareFriendAction(request, params, ROUTE);

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await unFriend({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
    });

    await prisma.$transaction(async (tx) => {
      await adjustRelationshipSnapshot({
        actorId: viewerId,
        targetUserId: target.id,
        isFriend: false,
        isFollowing: false,
        prismaClient: tx,
      });
      await adjustRelationshipSnapshot({
        actorId: target.id,
        targetUserId: viewerId,
        isFriend: false,
        isFollowing: false,
        prismaClient: tx,
      });
    });

    return apiResponse(
      true,
      result,
      friendMessages.FEEDBACK.unFriendSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Unfriend action failed");

    return apiResponse(
      false,
      {},
      error.message ?? friendMessages.FEEDBACK.unFriendFailure,
      error.status ?? 500,
      requestId
    );
  }
}
