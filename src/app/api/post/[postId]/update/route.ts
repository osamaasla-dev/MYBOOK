import { updatePost } from "@/features/parts/post/services/server";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  POST_UPDATE_RATE_MAX,
  POST_UPDATE_RATE_NAMESPACE,
  POST_UPDATE_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";
import {
  moderatePostContent,
  validatePostPayload,
} from "@/features/parts/post/services/server";
import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { validateCuid } from "@/schemas/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/[postId]/update";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function PUT(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("post update started");
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: POST_UPDATE_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: POST_UPDATE_RATE_WINDOW_SECONDS,
      maxRequests: POST_UPDATE_RATE_MAX,
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
      log.warn(postMessages.invalidPayload);
      return apiResponse(
        false,
        null,
        postMessages.invalidPayload,
        400,
        requestId
      );
    }
    const body = await request.json();
    const payloadResult = await validatePostPayload({
      body,
      log,
      requestId,
      postId: validatedPostId.data,
    });

    if (!payloadResult.ok) {
      return payloadResult.response;
    }

    // Moderate content if provided
    const moderationResult = await moderatePostContent({
      content: payloadResult.data.content,
      media: payloadResult.data.media,
      userId: viewer.id,
      requestId,
      cleanupMedia: payloadResult.cleanupMedia,
      log,
    });

    if (!moderationResult.ok) {
      return moderationResult.response;
    }

    const post = await updatePost({
      postId: validatedPostId.data,
      authorId: viewer.id,
      input: payloadResult.data,
      log,
      requestId,
    });
    if (post) {
      await clearRankedPostsCache(viewer.id);
    }
    log.info(postMessages.update.success);

    return apiResponse(true, post, postMessages.update.success, 200, requestId);
  } catch (error: unknown) {
    const err = normalizeError(error);
    log.error({ err, status: err.status }, postMessages.update.failed);
    return apiResponse(
      false,
      null,
      err.message ?? postMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
