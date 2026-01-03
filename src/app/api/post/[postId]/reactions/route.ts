import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { fetchPostReactions } from "@/features/parts/post/services/server/reactions/fetchPostReactions";
import { validatePostReactionsQuery } from "@/features/parts/post/services/server";

const ROUTE = "/api/post/[postId]/reactions";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("fetch reactions started");
    const { postId } = await context.params;
    const url = new URL(request.url);

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;
    const queryResult = await validatePostReactionsQuery({
      postId,
      searchParams: url.searchParams,
      log,
      requestId,
    });

    if (!queryResult.ok) {
      return queryResult.response;
    }

    const { postId: validatedPostId, query } = queryResult;

    const reactions = await fetchPostReactions({
      postId: validatedPostId,
      tab: query.tab,
      limit: query.limit,
      cursor: query.cursor,
      viewerId: viewer.id,
      requestId,
      route: ROUTE,
    });

    log.info(
      {
        postId: validatedPostId,
        tab: query.tab,
        count: reactions.items.length,
        viewerId: viewer.id,
      },
      "Post reactions fetched"
    );

    return apiResponse(
      true,
      reactions,
      postMessages.reactions.fetchSuccess,
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
      error.message ?? postMessages.reactions.fetchFailed,
      error.status ?? 500,
      requestId
    );
  }
}
