import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, genericMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { isJsonRequest } from "@/schemas/http";
import { validateCuid } from "@/schemas/ids";
import { ReactionState } from "@prisma/client";
import {
  buildReactionResponsePayload,
  isReactionRateLimitedForTarget,
  parseReactionPayload,
  type ReactionOperation,
} from "@/features/parts/post/utils/reaction";
import {
  COMMENT_REACTION_MAX_ACTIONS,
  COMMENT_REACTION_RATE_NAMESPACE,
  COMMENT_REACTION_WINDOW_S,
} from "@/features/parts/postDetails/constants";
import {
  persistCommentReaction,
  createCommentReactionNotification,
} from "@/features/parts/postDetails/services/server/comment";
import { isCommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import {
  broadcastCommentMetaEvent,
  broadcastCommentReactionEvent,
} from "@/features/parts/post/utils/realtime";

const ROUTE =
  "/api/post/[postId]/comments/[commentId]/reactions/create" as const;

type RouteParams = {
  params: Promise<{ postId?: string; commentId?: string }>;
};

export async function POST(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("comment reaction request started");
    const { postId, commentId } = await context.params;

    const validatedPostId = validateCuid(postId);
    const validatedCommentId = validateCuid(commentId);

    if (!validatedPostId.success || !validatedCommentId.success) {
      log.warn({ postId, commentId }, "Invalid route params for comment react");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Comment react attempted without authentication");
      return apiResponse(
        false,
        null,
        commentMessages.unauthorized,
        401,
        requestId
      );
    }

    if (!isJsonRequest(request)) {
      log.warn("Unsupported content-type for comment reaction payload");
      return apiResponse(
        false,
        null,
        commentMessages.invalidPayload,
        415,
        requestId
      );
    }

    let body: Awaited<ReturnType<typeof parseReactionPayload>>["data"];
    try {
      const json = await request.json();
      const parsed = parseReactionPayload(json);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues?.[0];
        log.warn(
          { issues: parsed.error.issues },
          "Invalid comment reaction payload"
        );
        return apiResponse(
          false,
          null,
          firstIssue?.message ?? commentMessages.invalidPayload,
          400,
          requestId
        );
      }
      body = parsed.data;
    } catch (parseError) {
      log.warn({ parseError }, "Failed to parse comment reaction payload");
      return apiResponse(
        false,
        null,
        commentMessages.invalidPayload,
        400,
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
        "Comment reaction rate limited"
      );
      return apiResponse(false, null, userMessages.rateLimited, 429, requestId);
    }

    const result = await persistCommentReaction({
      commentId: validatedCommentId.data,
      postId: validatedPostId.data,
      userId: session.user.id,
      reaction: body.reaction,
    });

    if (result.operation === ReactionState.ADD && result.commentAuthorId) {
      const viewerName = session.user.name ?? "Someone";
      void broadcastCommentReactionEvent({
        postId: validatedPostId.data,
        commentId: validatedCommentId.data,
        commentAuthorId: result.commentAuthorId,
        parentId: result.parentId,
        viewerId: session.user.id,
        viewerName,
        reactorName: viewerName,
        reaction: (result.reaction ?? body.reaction)!,
        operation: result.operation,
      });

      void createCommentReactionNotification({
        actorId: session.user.id,
        actorName: session.user.name,
        actorUsername: null,
        commentAuthorId: result.commentAuthorId,
        postId: validatedPostId.data,
        commentId: validatedCommentId.data,
        reaction: (result.reaction ?? body.reaction)!,
        requestId,
        route: ROUTE,
      });
    }

    // Broadcast comment metadata update
    void broadcastCommentMetaEvent({
      postId: validatedPostId.data,
      initiatorId: session.user.id,

      parentId: result.parentId,
      commentId: validatedCommentId.data,
      reactionsCount: result.reactionsCount,
      reactionSummary: result.reactionSummary,
    });

    log.info(
      {
        commentId: validatedCommentId.data,
        userId: session.user.id,
        operation: result.operation satisfies ReactionOperation,
      },
      `commentReaction.${result.operation}`
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
        "Comment reaction route validation failed"
      );
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const normalized = normalizeError(error);
    log.error(
      { err: normalized, status: normalized.status },
      "Comment reaction route failed"
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
