"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, userMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { ensureCommentDeleteAccess } from "@/features/parts/postDetails/services/server/comment";
import { isCommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { validateSession } from "@/features/services/server";
import { processCommentDeletion } from "@/features/parts/postDetails/services/server";

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

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    const access = await ensureCommentDeleteAccess({
      commentId: validatedCommentId.data,
      postId: validatedPostId.data,
      actorId: viewer.id,
    });

    const result = await processCommentDeletion({
      commentId: access.comment.id,
      postId: validatedPostId.data,
      parentId: access.comment.parentId,
      postAuthorId: access.post.authorId,
      deletedById: viewer.id,
      commentAuthorId: access.comment.authorId,
      requestId,
      route: ROUTE,
    });

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
