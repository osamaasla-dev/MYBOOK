import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { cancelFollowRequest } from "@/features/parts/follow/services/server";
import { prepareFollowAction, type FollowRouteContext } from "../shared";

const ROUTE = "/api/follow/[username]/cancel-request";

export async function DELETE(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "cancel-request",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await cancelFollowRequest({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
    });

    return apiResponse(
      true,
      result,
      followMessages.FEEDBACK.cancelRequestSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Cancel follow request failed");

    return apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.cancelRequestFailure,
      error.status ?? 500,
      requestId
    );
  }
}
