import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { getRequestLog } from "@/lib/request-log";
import { userMessages } from "@/lib/messages";

import {
  usernameSchema,
  type ProfileRouteData,
} from "@/features/pages/profile/types";
import {
  buildProfileSummary,
  buildViewerAwareProfile,
  derivePrivacyState,
  getViewerSession,
  fetchProfileUserByUsername,
} from "@/features/pages/profile/utils";
import { resolveViewerRelations } from "@/features/pages/profile/services/server";
import { recordInteraction } from "@/features/parts/interaction/services";
import {
  PROFILE_VIEW_RATE_MAX,
  PROFILE_VIEW_RATE_NAMESPACE,
  PROFILE_VIEW_RATE_WINDOW_SECONDS,
} from "@/features/pages/profile/constants";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import { extractClientIp } from "@/features/parts/follow/utils/request";

const ROUTE = "/api/users/profile";

type ProfileRouteContext = {
  params: { username?: string };
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

    const { viewerId, isAuthenticated } = await getViewerSession();

    const clientIp = extractClientIp(request);

    const limited = await consumeRateLimit({
      namespace: PROFILE_VIEW_RATE_NAMESPACE,
      identifiers: [
        { key: "user", value: viewerId },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: PROFILE_VIEW_RATE_WINDOW_SECONDS,
      maxRequests: PROFILE_VIEW_RATE_MAX,
    });

    // if (limited) {
    //   log.warn(
    //     { username, viewerId, clientIp },
    //     "Profile request rate-limited"
    //   );
    //   const res = apiResponse(
    //     false,
    //     {},
    //     userMessages.rateLimited,
    //     429,
    //     requestId
    //   );
    //   return res;
    // }

    const user = await fetchProfileUserByUsername(normalizedUsername);

    if (!user) {
      log.warn(`${userMessages.notFound}`);
      const res = apiResponse(false, {}, userMessages.notFound, 404, requestId);
      return res;
    }

    const relations = await resolveViewerRelations(viewerId, user.id);
    const privacy = derivePrivacyState(user, relations);

    if (privacy.restrictions?.reason === "PROFILE_BLOCKED") {
      log.warn({ username }, "Profile hidden due to block relationship");
      const res = apiResponse(false, {}, userMessages.notFound, 404, requestId);
      return res;
    }

    if (viewerId && viewerId !== user.id) {
      await recordInteraction({
        actorId: viewerId,
        targetUserId: user.id,
        type: "profileVisit",
      }).catch((error: unknown) => {
        log.error({ error }, "Failed to record profile visit interaction");
      });
    }

    const summary = buildProfileSummary(user, privacy);
    const shapedProfile = buildViewerAwareProfile(summary, relations.isSelf);

    const payload: ProfileRouteData = {
      profile: shapedProfile,
      viewer: {
        isAuthenticated,
        canViewFullProfile: privacy.canViewFullProfile,
        ...relations,
      },
      restrictions: privacy.restrictions,
    };

    const res = apiResponse(
      true,
      payload,
      userMessages.success,
      200,
      requestId
    );
    return res;
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
