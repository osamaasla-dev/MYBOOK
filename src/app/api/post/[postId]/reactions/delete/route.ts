import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { genericMessages, postMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import {
  buildReactionResponsePayload,
  isReactionRateLimited,
  type ReactionOperation,
} from "@/features/parts/post/utils/reaction";
import { removePostReaction } from "@/features/parts/post/services/server/reaction";
import { validateCuid } from "@/schemas/ids";

const ROUTE = "/api/post/[postId]/react";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function DELETE(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("reaction delete request started");
    const { postId } = await context.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn({ postId }, "Invalid postId parameter");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }
    const normalizedPostId = validatedPostId.data;

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Reaction delete attempted without authentication");
      return apiResponse(
        false,
        null,
        postMessages.unauthorized,
        401,
        requestId
      );
    }

    const rateLimited = await isReactionRateLimited({
      userId: session.user.id,
      postId: normalizedPostId,
    });
    if (rateLimited) {
      log.warn(
        { userId: session.user.id, postId: normalizedPostId },
        "Reaction delete rate limited"
      );
      return apiResponse(false, null, userMessages.rateLimited, 429, requestId);
    }

    const result = await removePostReaction({
      postId: normalizedPostId,
      userId: session.user.id,
    });

    log.info(
      {
        postId: normalizedPostId,
        userId: session.user.id,
        operation: result.operation satisfies ReactionOperation,
      },
      "reaction.removed"
    );

    return apiResponse(
      true,
      buildReactionResponsePayload(result),
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    if (error.code === "P2025") {
      return apiResponse(false, null, "Post not found.", 404, requestId);
    }

    log.error({ err: error, status: error.status }, "Reaction remove failed");
    return apiResponse(
      false,
      null,
      error.message ?? postMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
