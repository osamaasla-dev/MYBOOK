import { NextRequest } from "next/server";
import { ServerSession } from "@/utils/session";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { userMessages } from "@/lib/messages";
import { getProfilePosts } from "@/features/pages/profile/services/server/postsTab";
import { profilePostsQuerySchema } from "@/features/pages/profile/utils/postsTab";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import { isBlock } from "@/features/parts/block/utils/server";

const ROUTE = "/api/profile/posts";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info(`Profile posts request started`);

    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(userMessages.unauthorized);
      return apiResponse(false, {}, userMessages.unauthorized, 401, requestId);
    }

    const { searchParams } = new URL(request.url);
    const { cursor, limit } = profilePostsQuerySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit"),
    });

    const profileUser = await fetchProfileUserByUsername(params.username);
    if (!profileUser) {
      log.warn(
        { username: params.username, requestId },
        "Profile owner not found for posts"
      );
      return apiResponse(false, {}, userMessages.notFound, 404, requestId);
    }

    if (profileUser.id !== session.user.id) {
      const blockStatus = await isBlock(session.user.id, profileUser.id);
      if (blockStatus.anyBlock) {
        log.warn(
          { viewerId: session.user.id, profileUserId: profileUser.id },
          "Profile posts blocked by relationship"
        );
        return apiResponse(false, {}, userMessages.notFound, 404, requestId);
      }
    }

    const result = await getProfilePosts({
      username: params.username,
      viewerId: session.user.id,
      cursor,
      limit,
      log,
      requestId,
    });

    const payload = {
      posts: result.posts,
      nextCursor: result.nextCursor,
    };

    return apiResponse(true, payload, userMessages.success, 200, requestId);
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, `${userMessages.failed}`);

    return apiResponse(
      false,
      {},
      error.message ?? userMessages.failed,
      error.status ?? 500,
      requestId
    );
  }
}
