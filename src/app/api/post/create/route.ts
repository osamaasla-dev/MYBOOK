import { createPost } from "@/features/parts/post/services/server";
import { createPostSchema } from "@/features/parts/post/schemas";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages, moderationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { clearRankedPostsCache } from "@/features/pages/home/utils/posts/post-ranking/cache";
import { broadcastPostCreatedEvent } from "@/features/parts/post/utils/realtime";
import { getPostNotificationRecipients } from "@/features/parts/post/utils/recipients";
import { getActor } from "@/features/parts/post/utils/actor";
import { createPostNotifications } from "@/features/parts/post/services/server/postNotifications";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
  moderateImage,
  moderateVideo,
} from "@/features/parts/moderation/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/create";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("post creating started");
    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Create post attempted without authentication");
      return apiResponse(
        false,
        null,
        postMessages.unauthorized,
        401,
        requestId
      );
    }

    // Validate that user exists in database
    // const userExists = await prisma.user.findUnique({
    //   where: { id: session.user.id },
    //   select: { id: true },
    // });

    // if (!userExists) {
    //   log.warn({ userId: session.user.id }, "User not found in database");
    //   return apiResponse(false, null, "User not found", 404, requestId);
    // }

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
        log.error("Moderation key missing, rejecting post");
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
          "Moderation provider error while creating post"
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

    const post = await createPost({
      authorId: session.user.id,
      input: parsed.data,
    });
    if (post) {
      await clearRankedPostsCache(session.user.id);
    }
    log.info(
      { postId: post.id, userId: session.user.id },
      "Post created successfully"
    );

    try {
      const recipients = await getPostNotificationRecipients({
        authorId: session.user.id,
        visibility: post.visibility,
        visibilityPreference: post.visibilityPreference,
        requestId,
        ROUTE,
      });

      if (recipients.length) {
        const authorRecord = await getActor(session.user.id);
        const authorName = authorRecord?.name ?? session.user.name ?? "Someone";
        const authorUsername = authorRecord?.username ?? null;

        await Promise.all([
          createPostNotifications({
            actorId: session.user.id,
            postId: post.id,
            authorName,
            authorUsername,
            recipientIds: recipients,
            requestId,
            ROUTE,
          }),
          broadcastPostCreatedEvent({
            postId: post.id,
            authorId: session.user.id,
            authorName,
            recipientIds: recipients,
          }),
        ]);
        log.info(
          { postId: post.id, recipients: recipients.length },
          "Post created event broadcasted"
        );
      } else {
        log.warn({ postId: post.id }, "No post notification recipients found");
      }
    } catch (broadcastError) {
      log.error(
        { error: broadcastError, postId: post.id },
        "Failed to broadcast post created event"
      );
    }

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
