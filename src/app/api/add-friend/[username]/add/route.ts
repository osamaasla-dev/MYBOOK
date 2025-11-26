import { apiResponse } from "@/lib/apiResponse";
import { friendMessages } from "@/lib/messages";
import { normalizeError } from "@/lib/http/normalizeError";

import { prepareFriendAction, type FriendRouteContext } from "../shared";
import { requestFriendship } from "@/features/parts/addFriend/services";

const ROUTE = "/api/add-friend/[username]/add";

export async function POST(request: Request, { params }: FriendRouteContext) {
  const preparation = await prepareFriendAction(request, params, ROUTE);

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await requestFriendship({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
    });

    const res = apiResponse(
      true,
      result,
      friendMessages.FEEDBACK.requestSuccess,
      200,
      requestId
    );
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Friend request failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? friendMessages.FEEDBACK.requestFailure,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}
