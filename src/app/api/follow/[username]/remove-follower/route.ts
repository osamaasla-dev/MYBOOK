import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { removeFollower } from "@/features/parts/follow/services";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { prepareFollowAction, type FollowRouteContext } from "../shared";

const ROUTE = "/api/follow/[username]/remove-follower";

export async function DELETE(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "remove-follower",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await removeFollower({
      viewerId,
      viewerUsername,
      followerId: target.id,
      followerUsername: target.username,
    });

    await adjustRelationshipSnapshot({
      actorId: target.id,
      targetUserId: viewerId,
      isFollowing: false,
    });

    return apiResponse(
      true,
      result,
      followMessages.FEEDBACK.removeFollowerSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);

    log.error({ err, status: error.status }, "Remove follower request failed");

    return apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.removeFollowerFailure,
      error.status ?? 500,
      requestId
    );
  }
}
