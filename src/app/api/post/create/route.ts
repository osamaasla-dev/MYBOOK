import { createPost } from "@/features/parts/post/services";
import { createPostSchema } from "@/features/parts/post/schemas";
import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { postMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/post/create";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("post creating started");
    const session = await ServerSession();
    if (!session?.user?.id) {
      log.warn("Create post attempted without authentication");
      return apiResponse(
        false,
        null,
        postMessages.unauthorized,
        401,
        requestId
      );
    }

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      log.warn({ issues: parsed.error.issues }, "Invalid post payload");
      return apiResponse(
        false,
        null,
        firstIssue?.message ?? postMessages.invalidPayload,
        400,
        requestId
      );
    }

    const post = await createPost({
      authorId: session.user.id,
      input: parsed.data,
    });

    log.info(
      { postId: post.id, userId: session.user.id },
      "Post created successfully"
    );

    return apiResponse(true, post, postMessages.created, 201, requestId);
  } catch (error: unknown) {
    const err = normalizeError(error);
    log.error({ err, status: err.status }, "Create post handler failed");
    return apiResponse(
      false,
      null,
      err.message ?? postMessages.unexpectedError,
      err.status ?? 500,
      requestId
    );
  }
}
