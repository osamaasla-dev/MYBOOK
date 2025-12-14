import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { followMessages } from "@/lib/messages";
import { prepareFollowAction, type FollowRouteContext } from "../shared";
import { followProfile } from "@/features/parts/follow/services";
import { adjustRelationshipSnapshot } from "@/features/parts/interaction/services";
import { updateRankedPostRelationships } from "@/features/pages/home/utils/posts/post-ranking/cache";
const ROUTE = "/api/follow/[username]/follow";

export async function POST(request: Request, { params }: FollowRouteContext) {
  const preparation = await prepareFollowAction(request, params, {
    route: ROUTE,
    action: "follow",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewerId, viewerUsername, viewerName, target } =
    preparation.context;
  try {
    const result = await followProfile({
      viewerId,
      viewerUsername,
      viewerName,
      targetUserId: target.id,
      targetUsername: target.username,
      targetName: target.name,
      requiresApproval: target.isPrivate,
    });

    if (result.status === "FOLLOWED") {
      await adjustRelationshipSnapshot({
        actorId: viewerId,
        targetUserId: target.id,
        isFollowing: true,
      });

      await updateRankedPostRelationships({
        viewerId,
        authorId: target.id,
        isFollowing: true,
      });
    }

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
