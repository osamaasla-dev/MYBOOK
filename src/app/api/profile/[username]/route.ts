import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { userMessages } from "@/lib/messages";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  PROFILE_VIEW_RATE_MAX,
  PROFILE_VIEW_RATE_NAMESPACE,
  PROFILE_VIEW_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";
import { validateSession } from "@/features/services/server";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import { recordInteraction } from "@/features/parts/interaction/services";
import { processProfileView } from "@/features/pages/profile/services/server/processProfileView";
import { usernameSchema } from "@/features/pages/profile/types";

const ROUTE = "/api/users/profile";

type ProfileRouteContext = {
  params: Promise<{ username?: string }>;
};

export async function GET(request: Request, { params }: ProfileRouteContext) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info(`Profile request started`);
    const { username } = await params;

    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      log.warn(`${userMessages.missingParams}`);
      const res = apiResponse(
        false,
        {},
        userMessages.invalidParams,
        400,
        requestId
      );
      return res;
    }
    const normalizedUsername = parsed.data.toLowerCase();

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    // Rate limiting
    const limited = await checkRateLimit({
      namespace: PROFILE_VIEW_RATE_NAMESPACE,
      viewerId: viewer?.id,
      windowSeconds: PROFILE_VIEW_RATE_WINDOW_SECONDS,
      maxRequests: PROFILE_VIEW_RATE_MAX,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return limited.response;
    }

    const user = await fetchProfileUserByUsername(normalizedUsername);

    if (!user) {
      log.warn(`${userMessages.notFound}`);
      const res = apiResponse(false, {}, userMessages.notFound, 404, requestId);
      return res;
    }

    try {
      const result = await processProfileView({
        user,
        viewerId: viewer.id,
        requestId,
        route: ROUTE,
      });

      // Record interaction if needed
      if (result.shouldRecordInteraction) {
        await recordInteraction({
          actorId: viewer.id,
          targetUserId: user.id,
          type: "profileVisit",
        }).catch((error: unknown) => {
          log.error({ error }, "Failed to record profile visit interaction");
        });
      }

      const res = apiResponse(
        true,
        result.payload,
        userMessages.success,
        200,
        requestId
      );
      return res;
    } catch (processError: unknown) {
      if (
        processError instanceof Error &&
        processError.message === "PROFILE_BLOCKED"
      ) {
        const res = apiResponse(
          false,
          {},
          userMessages.notFound,
          404,
          requestId
        );
        return res;
      }
      throw processError;
    }
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, `${userMessages.failed}`);
    const res = apiResponse(
      false,
      {},
      error.message ?? userMessages.failed,
      error.status ?? 500,
      requestId
    );
    return res;
  }
}
