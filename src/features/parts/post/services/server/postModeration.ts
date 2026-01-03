import { apiResponse } from "@/lib/apiResponse";
import { moderationMessages } from "@/lib/messages";
import type { Logger } from "pino";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
  moderateImage,
  moderateVideo,
} from "@/features/parts/moderation/services/server";
import type { CreatePostInput } from "../../schemas";

export type PostModerationResult =
  | { ok: true }
  | { ok: false; response: Response };

export async function moderatePostContent({
  content,
  media,
  userId,
  requestId,
  cleanupMedia,
  log,
}: {
  content?: string;
  media?: CreatePostInput["media"];
  userId: string;
  requestId: string;
  cleanupMedia: (reason: string) => Promise<void>;
  log: Logger;
}): Promise<PostModerationResult> {
  try {
    const hasContent = content?.trim().length;
    const hasMedia = Array.isArray(media) && media.length > 0;

    // Moderate text content
    if (hasContent) {
      const decision = await moderateText(content ?? "", "post");
      if (decision.status === "reject") {
        log.warn({ userId }, "Post text blocked");
        await cleanupMedia("create-text-moderation");
        return {
          ok: false,
          response: apiResponse(
            false,
            null,
            moderationMessages.textBlocked,
            422,
            requestId
          ),
        };
      }
    }

    // Moderate media content
    if (hasMedia) {
      for (const mediaItem of media ?? []) {
        if (!mediaItem?.url) continue;

        const decision =
          mediaItem.type === "video"
            ? await moderateVideo(mediaItem.url, "post")
            : await moderateImage(mediaItem.url, "post");

        if (decision.status === "reject") {
          log.warn(
            {
              userId,
              mediaType: mediaItem.type,
              url: mediaItem.url,
            },
            "Post media blocked"
          );
          await cleanupMedia("create-media-moderation");
          return {
            ok: false,
            response: apiResponse(
              false,
              null,
              moderationMessages.mediaBlocked,
              422,
              requestId
            ),
          };
        }
      }
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof MissingModerationAPIKeyError) {
      log.error("Moderation key missing, rejecting post");
      await cleanupMedia("create-missing-moderation-key");
      return {
        ok: false,
        response: apiResponse(
          false,
          null,
          moderationMessages.missingKey,
          500,
          requestId
        ),
      };
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
      await cleanupMedia("create-moderation-provider-error");
      return {
        ok: false,
        response: apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        ),
      };
    }

    throw error;
  }
}
