"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { postMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { deletePost } from "@/features/parts/post/services/server/deletePost";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  POST_DELETE_RATE_MAX,
  POST_DELETE_RATE_NAMESPACE,
  POST_DELETE_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";

const ROUTE = "/api/post/[postId]/delete";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function DELETE(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: POST_DELETE_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: POST_DELETE_RATE_WINDOW_SECONDS,
      maxRequests: POST_DELETE_RATE_MAX,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const { postId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn(postMessages.delete.invalidParams);
      return apiResponse(
        false,
        null,
        postMessages.delete.invalidParams,
        400,
        requestId
      );
    }

    const result = await deletePost({
      postId: validatedPostId.data,
      userId: viewer.id,
      log,
      requestId,
    });
    if (result?.error) return result.error;

    log.info(
      { postId: validatedPostId.data, userId: viewer.id },
      postMessages.delete.success
    );

    return apiResponse(true, null, postMessages.delete.success, 200, requestId);
  } catch (error) {
    log.error({ error: normalizeError(error) }, postMessages.unexpectedError);
    return apiResponse(
      false,
      null,
      postMessages.unexpectedError,
      500,
      requestId
    );
  }
}
