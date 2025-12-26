import { Logger } from "pino";
import { apiResponse } from "@/lib/apiResponse";
import { moderationMessages } from "@/lib/messages";
import {
  MissingModerationAPIKeyError,
  moderateText,
  ModerationProviderError,
} from "@/features/parts/moderation/services";

export async function checkReplyModeration(
  content: string,
  log: Logger,
  requestId: string,
  metadata: { commentId: string; userId: string }
) {
  try {
    const decision = await moderateText(content, "comment");
    if (decision.status === "reject") {
      log.warn(
        { ...metadata, contentType: "reply" },
        "Reply blocked by moderation"
      );
      return {
        error: apiResponse(
          false,
          null,
          moderationMessages.textBlocked,
          422,
          requestId
        ),
      };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof MissingModerationAPIKeyError) {
      log.error("Moderation key missing, rejecting comment");
      return {
        error: apiResponse(
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
        "Moderation provider error while adding reply"
      );
      const friendlyMessage =
        error.status === 429
          ? moderationMessages.rateLimited
          : moderationMessages.failed;

      return {
        error: apiResponse(
          false,
          null,
          friendlyMessage,
          error.status,
          requestId
        ),
      };
    }

    // Handle unexpected errors
    log.error({ error }, "Unexpected error during reply moderation");
    return {
      error: error,
    };
  }
}
