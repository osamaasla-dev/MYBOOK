import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";
import { recordInteraction } from "@/features/parts/interaction/services";

import {
  createComment,
  createPostCommentNotification,
  resolveCommentContext,
} from "@/features/parts/postDetails/services/server";
import {
  broadcastCommentEvents,
  isCommentRouteError,
  parseCreateCommentPayload,
} from "@/features/parts/postDetails/utils/server/comments";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import { extractClientIp } from "@/features/parts/follow/utils/request";
import {
  COMMENT_RATE_NAMESPACE,
  MAX_REQUESTS,
  WINDOW_SECONDS,
} from "@/features/parts/postDetails/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/[postId]/comments/add";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function POST(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const { postId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn({ postId }, "Invalid postId parameter for comment add");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }
    const normalizedPostId = validatedPostId.data;

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Create comment attempted without authentication");
      return apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      );
    }

    const payload = await parseCreateCommentPayload(request, log);

    const clientIp = extractClientIp(request);
    const limited = await consumeRateLimit({
      namespace: COMMENT_RATE_NAMESPACE,
      identifiers: [
        { key: "user", value: session.user.id },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: WINDOW_SECONDS,
      maxRequests: MAX_REQUESTS,
    });
    if (limited) {
      log.warn(
        { userId: session.user.id, postId: normalizedPostId },
        "Comment rate limited"
      );
      return apiResponse(false, null, userMessages.rateLimited, 429, requestId);
    }

    const commentContext = await resolveCommentContext({
      postId: normalizedPostId,
      parentId: payload.parentId ?? null,
      viewerId: session.user.id,
    });

    const comment = await createComment({
      authorId: session.user.id,
      postId: normalizedPostId,
      content: payload.content,
      parentId: payload.parentId ?? null,
    });

    void recordInteraction({
      actorId: session.user.id,
      targetUserId: commentContext.post.authorId,
      type: "comment",
    }).catch((error: unknown) => {
      log.error({ error }, "Failed to record comment interaction");
    });

    const commentPreview = comment.content.slice(0, 140);
    void createPostCommentNotification({
      actorId: session.user.id,
      actorName: comment.author.name,
      actorUsername: comment.author.username,
      postAuthorId: commentContext.post.authorId,
      postId: comment.postId,
      commentId: comment.id,
      contentPreview: commentPreview,
      requestId,
      route: ROUTE,
    }).catch((error: unknown) => {
      log.error({ error }, "Failed to create post comment notification");
    });

    void broadcastCommentEvents({
      comment,
      postAuthorId: commentContext.post.authorId,
      parentId: payload.parentId ?? null,
      commentsCount: commentContext.post.commentsCount,
      sharesCount: commentContext.post.sharesCount,
      reactionSummary: commentContext.post.reactionSummary,
      log,
    });

    log.info(
      { commentId: comment.id, postId: comment.postId },
      "Comment created successfully"
    );

    return apiResponse(
      true,
      { comment },
      commentMessages.created,
      201,
      requestId
    );
  } catch (error: unknown) {
    if (isCommentRouteError(error)) {
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Add comment handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? commentMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
