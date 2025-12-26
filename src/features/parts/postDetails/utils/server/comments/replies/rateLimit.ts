import { userMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";
import { Logger } from "pino";
import {
  COMMENT_REPLY_RATE_NAMESPACE,
  COMMENT_REPLY_WINDOW_S,
  COMMENT_REPLY_MAX_ACTIONS,
} from "@/features/parts/postDetails/constants";
import { consumeRateLimit } from "@/features/utils/rateLimit";

export async function checkReplyRateLimit(
  userId: string,
  clientIp: string,
  log: Logger,
  requestId: string,
  metadata: { commentId: string }
) {
  const isRateLimited = await consumeRateLimit({
    namespace: COMMENT_REPLY_RATE_NAMESPACE,
    identifiers: [
      { key: "user", value: userId },
      { key: "ip", value: clientIp },
    ],
    windowSeconds: COMMENT_REPLY_WINDOW_S,
    maxRequests: COMMENT_REPLY_MAX_ACTIONS,
  });

  if (isRateLimited) {
    log.warn({ userId, commentId: metadata.commentId }, "Reply rate limited");
    return {
      error: apiResponse(false, null, userMessages.rateLimited, 429, requestId),
    };
  }

  return { success: true };
}
