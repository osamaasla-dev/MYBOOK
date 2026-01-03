import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  POST_CREATE_RATE_MAX,
  POST_CREATE_RATE_NAMESPACE,
  POST_CREATE_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";
import {
  moderatePostContent,
  processPostCreation,
  validatePostPayload,
} from "@/features/parts/post/services/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/create";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("post creating started");
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: POST_CREATE_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: POST_CREATE_RATE_WINDOW_SECONDS,
      maxRequests: POST_CREATE_RATE_MAX,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const body = await request.json();
    const payloadResult = await validatePostPayload({
      body,
      log,
      requestId,
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

    // Create the post and handle notifications
    const post = await processPostCreation({
      viewer,
      postData: payloadResult.data,
      requestId,
      ROUTE,
      log,
    });

    return apiResponse(true, post, postMessages.created, 201, requestId);
  } catch (error: unknown) {
    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Create post handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? postMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
