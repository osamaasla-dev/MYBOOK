import { apiResponse } from "@/lib/apiResponse";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { genericMessages, userMessages } from "@/lib/messages";
import { normalizeError } from "@/lib/http/normalizeError";
import { getImportantUsersForFeed } from "@/features/pages/home/services/posts/user-ranking";
import {
  getRankedFeedPage,
  type FeedPageParams,
} from "@/features/pages/home/services/posts/post-ranking";
import { fetchFeedPostsForViewer } from "@/features/pages/home/services/posts/feed";
const ROUTE = "/api/home/posts";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Feed posts request started");
    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(userMessages.unauthorized);
      return apiResponse(false, {}, userMessages.unauthorized, 401, requestId);
    }

    const { searchParams } = new URL(request.url);
    const cursorParam = searchParams.get("cursor");
    const pageSizeParam = searchParams.get("pageSize");

    const cursor = cursorParam ? Number(cursorParam) : undefined;
    if (cursorParam && Number.isNaN(cursor)) {
      log.warn("Invalid cursor param");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
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
        return apiResponse(
          false,
          responsePayload,
          userMessages.invalidParams,
          400,
          requestId
        );
      }
      pageSize = parsed;
    }

    const importantUsers = await getImportantUsersForFeed(session.user.id);
    log.info(
      { viewerId: session.user.id, importantUsers: importantUsers.length },
      "Important users resolved"
    );

    const feedParams: FeedPageParams = {
      viewerId: session.user.id,
      importantUsers,
      cursor,
      pageSize,
    };

    const page = await getRankedFeedPage(feedParams);

    const posts = await fetchFeedPostsForViewer({
      viewerId: session.user.id,
      postIds: page.postsIds,
    });

    const responsePayload = {
      posts,
      nextCursor: page.nextCursor,
    };

    log.info(
      {
        viewerId: session.user.id,
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
