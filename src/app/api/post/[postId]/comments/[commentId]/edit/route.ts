"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import {
  commentMessages,
  moderationMessages,
  genericMessages,
} from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";

import {
  ensureCommentEditAccess,
  updateComment,
} from "@/features/parts/postDetails/services/server/comment";
import {
  broadcastUpdateCommentEvents,
  isCommentRouteError,
  parseUpdateCommentPayload,
} from "@/features/parts/postDetails/utils/server/comments";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
} from "@/features/parts/moderation/services";

const ROUTE = "/api/post/[postId]/comments/[commentId]/edit";

type RouteParams = {
  params: Promise<{ postId?: string; commentId?: string }>;
};

export async function PATCH(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const { postId, commentId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    const validatedCommentId = validateCuid(commentId);
    if (!validatedPostId.success || !validatedCommentId.success) {
      log.warn({ postId, commentId }, "Invalid route params for comment edit");
      return apiResponse(
        false,
        {},
        genericMessages.invalidParams,
        400,
        requestId
      );
    }

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Edit comment attempted without authentication");
      return apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      );
    }

    const payload = await parseUpdateCommentPayload(request, log);
    if (payload.commentId !== validatedCommentId.data) {
      log.warn(
        {
          routeCommentId: validatedCommentId.data,
          payloadCommentId: payload.commentId,
        },
        "Payload commentId mismatch"
      );
      return apiResponse(
        false,
        null,
        genericMessages.invalidParams,
        400,
        requestId
      );
    }

    const access = await ensureCommentEditAccess({
      commentId: payload.commentId,
      postId: validatedPostId.data,
      actorId: session.user.id,
    });

    try {
      const decision = await moderateText(payload.content, "comment");
      if (decision.status === "reject") {
        log.warn(
          { postId: validatedPostId.data, commentId: payload.commentId },
          "Comment edit blocked by moderation"
        );
        return apiResponse(
          false,
          null,
          moderationMessages.textBlocked,
          422,
          requestId
        );
      }
    } catch (error) {
      if (error instanceof MissingModerationAPIKeyError) {
        log.error("Moderation key missing, rejecting comment edit");
        return apiResponse(
          false,
          null,
          moderationMessages.missingKey,
          500,
          requestId
        );
      }
      if (error instanceof ModerationProviderError) {
        log.warn(
          { status: error.status, details: error.details },
          "Moderation provider error while editing comment"
        );
        const friendlyMessage =
          error.status === 429
            ? moderationMessages.rateLimited
            : moderationMessages.failed;
        return apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        );
      }
      throw error;
    }

    const updatedComment = await updateComment({
      commentId: access.comment.id,
      content: payload.content,
    });

    log.info(
      { commentId: updatedComment.id, postId: validatedPostId.data },
      "Comment updated successfully"
    );

    void broadcastUpdateCommentEvents({
      comment: updatedComment,
      log,
    }).catch((error) => {
      log.warn(
        { err: error, commentId: updatedComment.id },
        "Failed to broadcast comment update"
      );
    });

    return apiResponse(
      true,
      { comment: updatedComment },
      commentMessages.updated,
      200,
      requestId
    );
  } catch (error: unknown) {
    if (isCommentRouteError(error)) {
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Edit comment handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? commentMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
