import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { prepareFollowAction, type FollowRouteContext } from "../shared";
import { unfollowProfile } from "@/features/parts/follow/services/server";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";

const ROUTE = "/api/follow/[username]/unfollow";

export async function DELETE(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "unfollow",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await unfollowProfile({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
    });

    await adjustRelationshipSnapshot({
      actorId: viewerId,
      targetUserId: target.id,
      isFollowing: false,
    });

    const res = apiResponse(
      true,
      result,
      followMessages.FEEDBACK.unfollowSuccess,
      200,
      requestId
    );
    return res;
  } catch (err) {
    const error = normalizeError(err);

    log.error({ err, status: error.status }, "Unfollow request failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.unfollowFailure,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}
