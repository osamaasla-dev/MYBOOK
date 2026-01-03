import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { genericMessages, postMessages } from "@/lib/messages";
import {
  acquirePostViewLock,
  enqueuePendingPostView,
  resolvePostViewIdentity,
} from "@/features/parts/post/utils/views";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  POST_VIEW_RATE_LIMIT_NAMESPACE,
  POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
  POST_VIEW_RATE_LIMIT_MAX,
} from "@/features/parts/ratelimit/constants";
import { validateCuid } from "@/schemas/ids";

const ROUTE = "/api/post/[postId]/view";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function POST(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("increase view started");
    const { postId } = await context.params;
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

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;
    const identity = resolvePostViewIdentity({ request, viewerId: viewer.id });

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: POST_VIEW_RATE_LIMIT_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: POST_VIEW_RATE_LIMIT_WINDOW_SECONDS,
      maxRequests: POST_VIEW_RATE_LIMIT_MAX,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const hasLock = await acquirePostViewLock(
      validatedPostId.data,
      identity.viewerKey,
      undefined,
      log
    );

    if (!hasLock) {
      log.debug({ postId, viewerKey: identity.viewerKey }, "Duplicate view");
      return apiResponse(
        true,
        { deduplicated: true },
        genericMessages.success,
        200,
        requestId
      );
    }

    await enqueuePendingPostView(
      {
        postId: validatedPostId.data,
        viewerId: identity.viewerId,
        sessionHash: identity.sessionHash,
        ip: identity.ip,
        countryCode: identity.countryCode,
        userAgent: identity.userAgent,
        recordedAt: Date.now(),
      },
      log
    );

    return apiResponse(
      true,
      { queued: true },
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err: error, status: error.status }, "View route failed");
    return apiResponse(
      false,
      {},
      error.message ?? postMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
