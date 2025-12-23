import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { commentMessages, genericMessages, userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";

import { fetchCommentReactions } from "@/features/parts/postDetails/services/server/comment";
import { commentReactionsQuerySchema } from "@/features/parts/postDetails/services/server/comment/reactions/schema";

const ROUTE = "/api/post/[postId]/comments/[commentId]/reactions" as const;

type RouteParams = {
  params: Promise<{ postId?: string; commentId?: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("fetch comment reactions started");
    const { postId, commentId } = await context.params;

    const validatedPostId = validateCuid(postId);
    const validatedCommentId = validateCuid(commentId);

    if (!validatedPostId.success || !validatedCommentId.success) {
      log.warn({ postId, commentId }, "Invalid params for comment reactions");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const session = await ServerSession();
    const url = new URL(request.url);

    const parsedQuery = commentReactionsQuerySchema.safeParse({
      tab: url.searchParams.get("tab") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues?.[0];
      log.warn(
        { issues: parsedQuery.error.issues },
        "Invalid comment reactions query parameters"
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

    const reactions = await fetchCommentReactions({
      postId: validatedPostId.data,
      commentId: validatedCommentId.data,
      tab,
      limit,
      cursor,
      viewerId: session?.user?.id ?? null,
      requestId,
      route: ROUTE,
    });

    log.info(
      {
        postId: validatedPostId.data,
        commentId: validatedCommentId.data,
        tab,
        count: reactions.items.length,
        viewerId: session?.user?.id ?? null,
      },
      "Comment reactions fetched"
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
      "Comment reactions fetch failed"
    );
    return apiResponse(
      false,
      {},
      error.message ?? commentMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
