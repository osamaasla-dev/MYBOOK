import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { friendMessages } from "@/lib/messages";

import { rejectFriendRequest } from "@/features/parts/addFriend/services";
import { prepareFriendAction, type FriendRouteContext } from "../shared";

const ROUTE = "/api/add-friend/[username]/reject-request";

export async function POST(request: Request, { params }: FriendRouteContext) {
  const preparation = await prepareFriendAction(request, params, ROUTE);

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await rejectFriendRequest({
      viewerId,
      viewerUsername,
      requesterId: target.id,
      requesterUsername: target.username,
    });

    return apiResponse(
      true,
      result,
      friendMessages.FEEDBACK.rejectRequestSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Reject friend request failed");

    return apiResponse(
      false,
      {},
      error.message ?? friendMessages.FEEDBACK.rejectRequestFailure,
      error.status ?? 500,
      requestId
    );
  }
}
