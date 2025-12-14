import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { genericMessages, postMessages, userMessages } from "@/lib/messages";
import {
  acquirePostViewLock,
  consumePostViewRateLimit,
  enqueuePendingPostView,
  resolvePostViewIdentity,
} from "@/features/parts/post/utils/views";
import { ServerSession } from "@/utils/session";

const ROUTE = "/api/post/[postId]/view";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function POST(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("increase view started");
    const { postId } = await context.params;
    if (!postId) {
      log.warn("Missing postId parameter");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const session = await ServerSession();
    const viewerId = session?.user?.id ?? null;
    const identity = resolvePostViewIdentity({ request, viewerId });

    const limited = await consumePostViewRateLimit(identity.viewerKey, {
      log,
    });
    if (limited) {
      log.warn({ postId, viewerKey: identity.viewerKey }, "View rate limited");
      return apiResponse(false, {}, userMessages.rateLimited, 429, requestId);
    }

    const hasLock = await acquirePostViewLock(
      postId,
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
        postId,
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
