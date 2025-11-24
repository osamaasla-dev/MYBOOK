import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { rejectFollowRequest } from "@/features/parts/follow/services";
import { prepareFollowAction, type FollowRouteContext } from "../shared";

const ROUTE = "/api/follow/[username]/reject-request";

export async function POST(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "reject-request",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await rejectFollowRequest({
      viewerId,
      viewerUsername,
      requesterId: target.id,
      requesterUsername: target.username,
    });

    return apiResponse(
      true,
      result,
      followMessages.FEEDBACK.rejectRequestSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Reject follow request failed");

    return apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.rejectRequestFailure,
      error.status ?? 500,
      requestId
    );
  }
}
