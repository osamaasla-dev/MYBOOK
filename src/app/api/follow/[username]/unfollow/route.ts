import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { prepareFollowAction, type FollowRouteContext } from "../shared";
import { unfollowPublicProfile } from "@/features/parts/follow/services";

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
    const result = await unfollowPublicProfile({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
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
