import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { prepareFollowAction, type FollowRouteContext } from "../shared";
import { followProfile } from "@/features/parts/follow/services";

const ROUTE = "/api/follow/[username]/follow";

export async function POST(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "follow",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, target } =
    preparation.context;

  try {
    const result = await followProfile({
      viewerId,
      viewerUsername,
      targetUserId: target.id,
      targetUsername: target.username,
      requiresApproval: target.isPrivate,
    });

    const message =
      result.status === "REQUESTED"
        ? "Follow request sent"
        : followMessages.FEEDBACK.followSuccess;

    const res = apiResponse(true, result, message, 200, requestId);
    return res;
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Follow request failed");
    const res = apiResponse(
      false,
      {},
      error.message ?? followMessages.FEEDBACK.followFailure,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}
