import { updatePost } from "@/features/parts/post/services/server";
import { createPostSchema } from "@/features/parts/post/schemas";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages, moderationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
  moderateImage,
  moderateVideo,
} from "@/features/parts/moderation/services";
import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import { extractClientIp } from "@/features/parts/follow/utils/request";
import {
  POST_UPDATE_RATE_NAMESPACE,
  POST_UPDATE_RATE_WINDOW_SECONDS,
  POST_UPDATE_RATE_MAX,
} from "@/features/parts/post/constants";

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
    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Update post attempted without authentication");
      return apiResponse(
        false,
        null,
        postMessages.unauthorized,
        401,
        requestId
      );
    }

    // Rate limiting
    const clientIp = extractClientIp(request);
    const limited = await consumeRateLimit({
      namespace: POST_UPDATE_RATE_NAMESPACE,
      identifiers: [
        { key: "user", value: session.user.id },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: POST_UPDATE_RATE_WINDOW_SECONDS,
      maxRequests: POST_UPDATE_RATE_MAX,
    });

    if (limited) {
      log.warn(
        {
          userId: session.user.id,
          ip: clientIp,
        },
        "Post update rate limit exceeded"
      );
      return apiResponse(
        false,
        null,
        "Too many update attempts. Please try again later.",
        429,
        requestId
      );
    }

    const { postId } = await routeContext.params;
    const body = await request.json();

    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      log.warn({ issues: parsed.error.issues }, "Invalid post payload");
      return apiResponse(
        false,
        null,
        firstIssue?.message ?? postMessages.invalidPayload,
        400,
        requestId
      );
    }

    try {
      const hasContent = parsed.data.content?.trim().length;
      const hasMedia =
        Array.isArray(parsed.data.media) && parsed.data.media.length > 0;

      if (hasContent) {
        const decision = await moderateText(parsed.data.content ?? "", "post");
        if (decision.status === "reject") {
          log.warn({ userId: session.user.id }, "Post text blocked");
          return apiResponse(
            false,
            null,
            moderationMessages.textBlocked,
            422,
            requestId
          );
        }
      }

      if (hasMedia) {
        for (const media of parsed.data.media ?? []) {
          if (!media?.url) continue;

          const decision =
            media.type === "video"
              ? await moderateVideo(media.url, "post")
              : await moderateImage(media.url, "post");

          if (decision.status === "reject") {
            log.warn(
              {
                userId: session.user.id,
                mediaType: media.type,
                url: media.url,
              },
              "Post media blocked"
            );
            return apiResponse(
              false,
              null,
              moderationMessages.mediaBlocked,
              422,
              requestId
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof MissingModerationAPIKeyError) {
        log.error("Moderation key missing, rejecting post update");
        return apiResponse(
          false,
          null,
          moderationMessages.missingKey,
          500,
          requestId
        );
      }
      if (error instanceof ModerationProviderError) {
        log.warn(
          { status: error.status, details: error.details },
          "Moderation provider error while updating post"
        );
        const friendlyMessage =
          error.status === 429
            ? moderationMessages.rateLimited
            : moderationMessages.failed;
        return apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        );
      }
      throw error;
    }

    const post = await updatePost({
      postId,
      authorId: session.user.id,
      input: parsed.data,
      log,
      requestId,
    });
    if (post) {
      await clearRankedPostsCache(session.user.id);
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
