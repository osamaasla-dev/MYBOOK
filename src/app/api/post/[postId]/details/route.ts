import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { genericMessages, postMessages, userMessages } from "@/lib/messages";
import { ServerSession } from "@/utils/session";
import { validateCuid } from "@/schemas/ids";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { getPostDetailsForViewer } from "@/features/parts/postDetails/services/server";

const ROUTE = "/api/post/[postId]/details";

type RouteParams = {
  params: Promise<{ postId?: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("post details request started");
    const { postId } = await context.params;
    const validatedPostId = validateCuid(postId);

    if (!validatedPostId.success) {
      log.warn({ postId }, "Invalid postId parameter for details route");
      return apiResponse(false, {}, userMessages.invalidParams, 400, requestId);
    }

    const normalizedPostId = validatedPostId.data;
    const session = await ServerSession();
    const viewerId = session?.user?.id ?? null;

    const postDetails = await getPostDetailsForViewer({
      postId: normalizedPostId,
      viewerId,
    });

    if (!postDetails) {
      log.warn(
        { postId: normalizedPostId },
        "Post not found for details route"
      );
      return apiResponse(false, {}, "Post not found.", 404, requestId);
    }

    const feedPost: FeedPost = postDetails.post;

    log.info(
      { postId: normalizedPostId, viewerId },
      "Post details request completed"
    );

    return apiResponse(
      true,
      { post: feedPost },
      genericMessages.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err: error, status: error.status }, "Post details failed");
    return apiResponse(
      false,
      {},
      error.message ?? postMessages.unexpectedError,
      error.status ?? 500,
      requestId
    );
  }
}
