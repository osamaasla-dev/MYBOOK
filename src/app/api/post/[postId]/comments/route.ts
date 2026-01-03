import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { commentMessages } from "@/lib/messages";

import {
  ensureCommentFetchAccess,
  fetchPostComments,
} from "@/features/parts/postDetails/services/server";
import {
  isCommentRouteError,
  parseCommentsQueryParams,
  parseCommentsRouteParams,
} from "@/features/parts/postDetails/utils/server/comments";
import { validateSession } from "@/features/services/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/[postId]/comments";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function GET(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Fetching comments started");
    const { postId } = await routeContext.params;
    const normalizedPostId = parseCommentsRouteParams(postId, log);

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    const { searchParams } = new URL(request.url);
    const { cursor, parentId, limit } = parseCommentsQueryParams(
      searchParams,
      log
    );

    await ensureCommentFetchAccess({
      postId: normalizedPostId,
      parentId,
      viewerId: viewer.id,
    });

    const result = await fetchPostComments({
      postId: normalizedPostId,
      parentId,
      cursor,
      limit,
      viewerId: viewer.id,
    });

    log.info("Fetching comments completed");
    return apiResponse(
      true,
      {
        comments: result.comments,
        nextCursor: result.nextCursor,
      },
      commentMessages.fetched,
      200,
      requestId
    );
  } catch (error) {
    if (isCommentRouteError(error)) {
      log.error({ err: error }, "Fetch comments handler failed");
      return apiResponse(false, null, error.message, error.status, requestId);
    }

    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Fetch comments handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? commentMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
