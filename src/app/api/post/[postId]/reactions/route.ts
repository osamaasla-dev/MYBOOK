import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { genericMessages, postMessages, userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";

import { fetchPostReactions } from "@/features/parts/post/services/server/reactions/fetchPostReactions";
import { postReactionsQuerySchema } from "@/features/parts/post/services/server/reactions/schema";

const ROUTE = "/api/post/[postId]/reactions";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("fetch reactions started");
    const { postId } = await context.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn({ postId }, "Invalid postId parameter for reactions list");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const normalizedPostId = validatedPostId.data;
    const session = await ServerSession();
    const url = new URL(request.url);

    const parsedQuery = postReactionsQuerySchema.safeParse({
      postId: normalizedPostId,
      tab: url.searchParams.get("tab") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues?.[0];
      log.warn(
        { issues: parsedQuery.error.issues },
        "Invalid post reactions query parameters"
      );
      return apiResponse(
        false,
        {},
        firstIssue?.message ?? genericMessages.invalidParams,
        400,
        requestId
      );
    }

    const { tab, limit, cursor } = parsedQuery.data;

    const reactions = await fetchPostReactions({
      postId: normalizedPostId,
      tab,
      limit,
      cursor,
      viewerId: session?.user?.id ?? null,
    });

    log.info(
      {
        postId: normalizedPostId,
        tab,
        count: reactions.items.length,
        viewerId: session?.user?.id ?? null,
      },
      "Post reactions fetched"
    );

    return apiResponse(
      true,
      reactions,
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error(
      { err: error, status: error.status },
      "Post reactions fetch failed"
    );
    return apiResponse(
      false,
      {},
      error.message ?? postMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
