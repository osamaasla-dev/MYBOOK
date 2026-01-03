"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, genericMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { validateSession } from "@/features/services/server";
import {
  parseUpdateCommentPayload,
  isCommentRouteError,
} from "@/features/parts/postDetails/utils/server/comments";
import {
  moderateCommentContent,
  processCommentUpdate,
  ensureCommentEditAccess,
} from "@/features/parts/postDetails/services/server";

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

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    const payload = await parseUpdateCommentPayload(request, log);
    if (payload.commentId !== validatedCommentId.data) {
      log.warn(
        {
          routeCommentId: validatedCommentId.data,
          payloadCommentId: payload.commentId,
        },
        genericMessages.invalidParams
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
      actorId: viewer.id,
    });

    // Moderate content
    const moderationResult = await moderateCommentContent({
      content: payload.content,
      userId: viewer.id,
      postId: validatedPostId.data,
      log,
      requestId,
    });

    if (!moderationResult.ok) {
      return moderationResult.response;
    }

    const updatedComment = await processCommentUpdate({
      commentId: access.comment.id,
      content: payload.content,
      actorId: viewer.id,
      requestId,
      route: ROUTE,
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
