import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, genericMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";

import {
  buildReactionResponsePayload,
  isReactionRateLimitedForTarget,
  type ReactionOperation,
} from "@/features/parts/post/utils/reaction";
import {
  COMMENT_REACTION_MAX_ACTIONS,
  COMMENT_REACTION_RATE_NAMESPACE,
  COMMENT_REACTION_WINDOW_S,
} from "@/features/parts/postDetails/constants";
import { removeCommentReaction } from "@/features/parts/postDetails/services/server/comment";
import { isCommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { broadcastCommentMetaEvent } from "@/features/parts/post/utils/realtime";

const ROUTE =
  "/api/post/[postId]/comments/[commentId]/reactions/delete" as const;

type RouteParams = {
  params: Promise<{ postId?: string; commentId?: string }>;
};

export async function DELETE(_request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("comment reaction delete started");
    const { postId, commentId } = await context.params;

    const validatedPostId = validateCuid(postId);
    const validatedCommentId = validateCuid(commentId);

    if (!validatedPostId.success || !validatedCommentId.success) {
      log.warn(
        { postId, commentId },
        "Invalid route params for comment reaction delete"
      );
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Comment reaction delete attempted without authentication");
      return apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      );
    }

    const rateLimited = await isReactionRateLimitedForTarget({
      namespace: COMMENT_REACTION_RATE_NAMESPACE,
      windowMs: COMMENT_REACTION_WINDOW_S,
      maxActions: COMMENT_REACTION_MAX_ACTIONS,
      targetId: validatedCommentId.data,
      userId: session.user.id,
    });

    if (rateLimited) {
      log.warn(
        { userId: session.user.id, commentId: validatedCommentId.data },
        "Comment reaction delete rate limited"
      );
      return apiResponse(false, null, userMessages.rateLimited, 429, requestId);
    }

    const result = await removeCommentReaction({
      commentId: validatedCommentId.data,
      postId: validatedPostId.data,
      userId: session.user.id,
    });

    void broadcastCommentMetaEvent({
      postId: postId ?? null,
      initiatorId: session.user.id,
      parentId: result.parentId,
      commentId: commentId ?? null,
      reactionsCount: result.reactionsCount,
      reactionSummary: result.reactionSummary,
    });
    log.info(
      {
        commentId: validatedCommentId.data,
        userId: session.user.id,
        operation: result.operation satisfies ReactionOperation,
      },
      "commentReaction.removed"
    );

    return apiResponse(
      true,
      buildReactionResponsePayload(result),
      genericMessages.success,
      200,
      requestId
    );
  } catch (error) {
    if (isCommentRouteError(error)) {
      log.warn(
        { err: error, status: error.status },
        "Comment reaction delete failed"
      );
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const normalized = normalizeError(error);
    log.error(
      { err: normalized, status: normalized.status },
      "Comment reaction delete route failed"
    );
    return apiResponse(
      false,
      null,
      normalized.message ?? commentMessages.unexpectedError,
      normalized.status ?? 500,
      requestId
    );
  }
}
