import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages, genericMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  COMMENT_RATE_NAMESPACE,
  COMMENT_MAX_ACTIONS,
  COMMENT_WINDOW_S,
} from "@/features/parts/ratelimit/constants";
import {
  isCommentRouteError,
  parseCreateCommentPayload,
} from "@/features/parts/postDetails/utils/server/comments";
import { validateSession } from "@/features/services/server";
import {
  processCommentCreation,
  moderateCommentContent,
} from "@/features/parts/postDetails/services/server";
import { validateReplyCreation } from "@/features/parts/postDetails/services/server/comment/validateReply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/[postId]/comments/add";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function POST(
  request: Request,
  routeContext: RouteParams
): Promise<Response> {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const { postId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn({ postId }, "Invalid postId parameter for comment add");
      return apiResponse(
        false,
        {},
        genericMessages.invalidParams,
        400,
        requestId
      );
    }
    const normalizedPostId = validatedPostId.data;

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: COMMENT_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: COMMENT_WINDOW_S,
      maxRequests: COMMENT_MAX_ACTIONS,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const payload = await parseCreateCommentPayload(request, log);

    // Moderate content
    const moderationResult = await moderateCommentContent({
      content: payload.content,
      userId: viewer.id,
      postId: normalizedPostId,
      log,
      requestId,
    });

    if (!moderationResult.ok) {
      return moderationResult.response;
    }

    // Protection: Prevent creating replies to replies (only allow replies to main comments)
    const validationError = await validateReplyCreation(
      payload,
      log,
      requestId
    );
    if (validationError?.error) return validationError.error;

    const comment = await processCommentCreation({
      authorId: viewer.id,
      postId: normalizedPostId,
      content: payload.content,
      parentId: payload.parentId,
      requestId,
      route: ROUTE,
    });

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
