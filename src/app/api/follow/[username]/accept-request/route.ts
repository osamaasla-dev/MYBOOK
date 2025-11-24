import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { acceptFollowRequest } from "@/features/parts/follow/services";
import { prepareFollowAction, type FollowRouteContext } from "../shared";

const ROUTE = "/api/follow/[username]/accept-request";

export async function POST(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "accept-request",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await acceptFollowRequest({
      viewerId,
      viewerUsername,
      requesterId: target.id,
      requesterUsername: target.username,
    });

    return apiResponse(
      true,
      result,
      followMessages.FEEDBACK.acceptRequestSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Accept follow request failed");

    return apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.acceptRequestFailure,
      error.status ?? 500,
      requestId
    );
  }
}
