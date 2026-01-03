import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  POST_REACTION_MAX_ACTIONS,
  POST_REACTION_RATE_NAMESPACE,
  POST_REACTION_WINDOW_MS,
} from "@/features/parts/ratelimit/constants";
import { type ReactionOperation } from "@/features/parts/post/utils/reaction";
import { persistPostReaction } from "@/features/parts/post/services/server";
import { validateSession } from "@/features/services/server";
import { validateReactionPayload } from "@/features/parts/post/services/server";
import { validateCuid } from "@/schemas/ids";

const ROUTE = "/api/post/[postId]/react";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function POST(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("reaction request started");
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

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: POST_REACTION_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: Math.floor(POST_REACTION_WINDOW_MS / 1000),
      maxRequests: POST_REACTION_MAX_ACTIONS,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const payloadResult = await validateReactionPayload({
      request,
      log,
      requestId,
    });

    if (!payloadResult.ok) {
      return payloadResult.response;
    }

    const result = await persistPostReaction({
      postId: validatedPostId.data,
      userId: viewer.id,
      reaction: payloadResult.data!.reaction,
    });

    log.info(
      {
        postId: validatedPostId.data,
        userId: viewer.id,
        operation: result.operation satisfies ReactionOperation,
      },
      `reaction.${result.operation}`
    );

    return apiResponse(
      true,
      result,
      postMessages.reactions.fetchSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    if (error.code === "P2025") {
      return apiResponse(false, null, postMessages.notFound, 404, requestId);
    }

    log.error({ err: error, status: error.status }, "React route failed");
    return apiResponse(
      false,
      null,
      error.message ?? postMessages.reactions.fetchFailed,
      error.status ?? 500,
      requestId
    );
  }
}
