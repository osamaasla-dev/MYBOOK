import { NextRequest } from "next/server";
import { ServerSession } from "@/utils/session";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { userMessages } from "@/lib/messages";
import { getProfilePosts } from "@/features/pages/profile/services/server/postsTab";
import { profilePostsQuerySchema } from "@/features/pages/profile/utils/postsTab";

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
