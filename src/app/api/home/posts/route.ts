import { apiResponse } from "@/lib/apiResponse";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { genericMessages } from "@/lib/messages";
import { normalizeError } from "@/lib/http/normalizeError";
import { getImportantUsersForFeed } from "@/features/pages/home/services/posts/user-ranking";
import {
  getRankedFeedPage,
  type FeedPageParams,
} from "@/features/pages/home/services/posts/post-ranking";
import { fetchFeedPostsForViewer } from "@/features/pages/home/services/posts/feed";
import { parseFeedParams } from "@/features/pages/home/services/utils";
const ROUTE = "/api/home/posts";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Feed posts request started");
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    const { searchParams } = new URL(request.url);
    const parsedParams = parseFeedParams(searchParams, log, requestId);
    if (parsedParams.error) {
      return parsedParams.error;
    }

    const { cursor, pageSize } = parsedParams;

    const importantUsers = await getImportantUsersForFeed(viewer.id);
    log.info(
      { viewerId: viewer.id, importantUsers: importantUsers.length },
      "Important users resolved"
    );

    const feedParams: FeedPageParams = {
      viewerId: viewer.id,
      importantUsers,
      cursor,
      pageSize,
    };

    const page = await getRankedFeedPage(feedParams);

    const posts = await fetchFeedPostsForViewer({
      viewerId: viewer.id,
      postIds: page.postsIds,
    });

    const responsePayload = {
      posts,
      nextCursor: page.nextCursor,
    };

    log.info(
      {
        viewerId: viewer.id,
        fetchedPosts: posts.length,
        nextCursor: responsePayload.nextCursor,
        cacheHit: page.cacheHit,
      },
      "Feed posts request finished"
    );

    return apiResponse(
      true,
      responsePayload,
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Feed posts request failed");
    return apiResponse(
      false,
      {},
      error.message ?? genericMessages.unknownError,
      error.status ?? 500,
      requestId
    );
  }
}
