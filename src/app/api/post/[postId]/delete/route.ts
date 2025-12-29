"use server";

import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { postMessages, userMessages } from "@/lib/messages";
import { validateCuid } from "@/schemas/ids";
import { ServerSession } from "@/utils/session";
import { deletePost } from "@/features/parts/post/services/server/deletePost";

const ROUTE = "/api/post/[postId]/delete";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function DELETE(request: Request, routeContext: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn(userMessages.unauthorized);
      return apiResponse(
        false,
        null,
        userMessages.unauthorized,
        401,
        requestId
      );
    }

    const { postId } = await routeContext.params;
    const validatedPostId = validateCuid(postId);
    if (!validatedPostId.success) {
      log.warn(postMessages.delete.invalidParams);
      return apiResponse(
        false,
        null,
        postMessages.delete.invalidParams,
        400,
        requestId
      );
    }

    const result = await deletePost({
      postId: validatedPostId.data,
      userId: session.user.id,
      log,
      requestId,
    });
    if (result?.error) return result.error;

    log.info(
      { postId: validatedPostId.data, userId: session.user.id },
      postMessages.delete.success
    );

    return apiResponse(true, null, postMessages.delete.success, 200, requestId);
  } catch (error) {
    log.error({ error: normalizeError(error) }, postMessages.unexpectedError);
    return apiResponse(
      false,
      null,
      postMessages.unexpectedError,
      500,
      requestId
    );
  }
}
