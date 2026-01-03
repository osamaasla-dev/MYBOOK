import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, genericMessages, userMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import { buildReactionResponsePayload } from "@/features/parts/post/utils/reaction";
import {
  COMMENT_REACTION_MAX_ACTIONS,
  COMMENT_REACTION_RATE_NAMESPACE,
  COMMENT_REACTION_WINDOW_S,
} from "@/features/parts/ratelimit/constants";
import { isCommentRouteError } from "@/features/parts/postDetails/utils/server/comments";
import { validateSession } from "@/features/services/server";
import {
  processCommentReactionCreation,
  validateCommentReactionPayload,
} from "@/features/parts/postDetails/services/server";

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

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: COMMENT_REACTION_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: COMMENT_REACTION_WINDOW_S,
      maxRequests: COMMENT_REACTION_MAX_ACTIONS,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const payloadResult = await validateCommentReactionPayload({
      request,
      log,
      requestId,
    });

    if (!payloadResult.ok) {
      return payloadResult.response;
    }

    const result = await processCommentReactionCreation({
      commentId: validatedCommentId.data,
      postId: validatedPostId.data,
      userId: viewer.id,
      reaction: payloadResult.data!.reaction,
      userName: viewer.username,
      name: viewer.name ?? null,
      requestId,
      route: ROUTE,
    });

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
