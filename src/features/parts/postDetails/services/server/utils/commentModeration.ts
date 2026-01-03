import { apiResponse } from "@/lib/apiResponse";
import { moderationMessages } from "@/lib/messages";
import type { Logger } from "pino";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
} from "@/features/parts/moderation/services/server";

export type ModerateCommentResult =
  | { ok: true }
  | { ok: false; response: Response };

export async function moderateCommentContent({
  content,
  userId,
  postId,
  log,
  requestId,
}: {
  content: string;
  userId: string;
  postId: string;
  log: Logger;
  requestId: string;
}): Promise<ModerateCommentResult> {
  try {
    const decision = await moderateText(content, "comment");
    if (decision.status === "reject") {
      log.warn({ postId, userId }, "Comment blocked by moderation");
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
    return { ok: true };
  } catch (error) {
    if (error instanceof MissingModerationAPIKeyError) {
      log.error("Moderation key missing, rejecting comment");
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
        "Moderation provider error while adding comment"
      );
      const friendlyMessage =
        error.status === 429
          ? moderationMessages.rateLimited
          : moderationMessages.failed;
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
