import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";
import type { Logger } from "pino";

export type ParsedFeedParams = {
  cursor?: number;
  pageSize?: number;
  error?: Response;
};

export function parseFeedParams(
  searchParams: URLSearchParams,
  log: Logger,
  requestId: string
): ParsedFeedParams {
  const cursorParam = searchParams.get("cursor");
  const pageSizeParam = searchParams.get("pageSize");

  const cursor = cursorParam ? Number(cursorParam) : undefined;
  if (cursorParam && Number.isNaN(cursor)) {
    log.warn("Invalid cursor param");
    return {
      error: apiResponse(false, {}, userMessages.invalidParams, 400, requestId),
    };
  }

  let pageSize: number | undefined;
  if (pageSizeParam) {
    const parsed = Number(pageSizeParam);
    if (Number.isNaN(parsed) || parsed <= 0) {
      log.warn("Invalid pageSize param");
      const responsePayload = {
        posts: [],
        nextCursor: null,
      };
      return {
        error: apiResponse(
          false,
          responsePayload,
          userMessages.invalidParams,
          400,
          requestId
        ),
      };
    }
    pageSize = parsed;
  }

  return { cursor, pageSize };
}
