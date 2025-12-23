import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { genericMessages, postMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import {
  buildReactionResponsePayload,
  isReactionRateLimited,
  parseReactionPayload,
  type ReactionOperation,
} from "@/features/parts/post/utils/reaction";
import { persistPostReaction } from "@/features/parts/post/services/server/reaction";
import { isJsonRequest } from "@/schemas/http";
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
      log.warn({ postId }, "Invalid postId parameter");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }
    const normalizedPostId = validatedPostId.data;

    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("React attempted without authentication");
      return apiResponse(
        false,
        null,
        postMessages.unauthorized,
        401,
        requestId
      );
    }

    if (!isJsonRequest(request)) {
      log.warn("Unsupported content-type for reaction payload");
      return apiResponse(
        false,
        null,
        postMessages.invalidPayload,
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
          "Invalid reaction payload received"
        );
        return apiResponse(
          false,
          null,
          firstIssue?.message ?? postMessages.invalidPayload,
          400,
          requestId
        );
      }
      body = parsed.data;
    } catch (parseError) {
      log.warn({ parseError }, "Failed to parse reaction payload");
      return apiResponse(
        false,
        null,
        postMessages.invalidPayload,
        400,
        requestId
      );
    }

    const rateLimited = await isReactionRateLimited({
      userId: session.user.id,
      postId: normalizedPostId,
    });
    if (rateLimited) {
      log.warn(
        { userId: session.user.id, postId: normalizedPostId },
        "Reaction rate limited"
      );
      return apiResponse(false, null, userMessages.rateLimited, 429, requestId);
    }

    const result = await persistPostReaction({
      postId: normalizedPostId,
      userId: session.user.id,
      reaction: body.reaction,
    });

    log.info(
      {
        postId: normalizedPostId,
        userId: session.user.id,
        operation: result.operation satisfies ReactionOperation,
      },
      `reaction.${result.operation}`
    );

    return apiResponse(
      true,
      buildReactionResponsePayload(result),
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    if (error.code === "P2025") {
      return apiResponse(false, null, "Post not found.", 404, requestId);
    }

    log.error({ err: error, status: error.status }, "React route failed");
    return apiResponse(
      false,
      null,
      error.message ?? postMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
