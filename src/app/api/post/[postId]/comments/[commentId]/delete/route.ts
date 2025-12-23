"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";

import {
  ensureCommentDeleteAccess,
  deleteComment,
} from "@/features/parts/postDetails/services/server/comment";
import { applyNegativeSignal } from "@/features/parts/interaction/services/negativeSignal";
import {
  broadcastDeleteCommentEvents,
  isCommentRouteError,
} from "@/features/parts/postDetails/utils/server/comments";

const ROUTE = "/api/post/[postId]/comments/[commentId]/delete";

type RouteParams = {
  params: Promise<{ postId?: string; commentId?: string }>;
};

export async function DELETE(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const { postId, commentId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    const validatedCommentId = validateCuid(commentId);
    if (!validatedPostId.success || !validatedCommentId.success) {
      log.warn(
        { postId, commentId },
        "Invalid route params for comment delete"
      );
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Delete comment attempted without authentication");
      return apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      );
    }

    const access = await ensureCommentDeleteAccess({
      commentId: validatedCommentId.data,
      postId: validatedPostId.data,
      actorId: session.user.id,
    });

    const result = await deleteComment({
      commentId: access.comment.id,
      postId: validatedPostId.data,
      parentId: access.comment.parentId,
      postAuthorId: access.post.authorId,
      deletedById: session.user.id,
    });

    if (
      access.comment.authorId &&
      access.comment.authorId !== session.user.id
    ) {
      void applyNegativeSignal({
        actorId: session.user.id,
        targetUserId: access.comment.authorId,
        type: "deleteComment",
      }).catch((error) => {
        log.warn(
          {
            err: error,
            actorId: session.user.id,
            targetUserId: access.comment.authorId,
          },
          "Failed to record delete comment negative signal"
        );
      });
    }

    void broadcastDeleteCommentEvents({
      postId: validatedPostId.data,
      postAuthorId: access.post.authorId,
      commentId: access.comment.id,
      parentId: access.comment.parentId ?? null,
      commentsCount: result.commentsCount,
      sharesCount: result.sharesCount,
      reactionSummary: result.reactionSummary,
      initiatorId: session.user.id,
      log,
    });

    log.info(
      { commentId: result.id, postId: validatedPostId.data },
      "Comment deleted successfully"
    );

    return apiResponse(
      true,
      { commentId: result.id },
      commentMessages.deleted,
      200,
      requestId
    );
  } catch (error: unknown) {
    if (isCommentRouteError(error)) {
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Delete comment handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? commentMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
