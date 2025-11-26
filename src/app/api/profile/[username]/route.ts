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
  consumeProfileRateLimit,
} from "@/features/pages/profile/utils";
import { resolveViewerRelations } from "@/features/pages/profile/services";

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

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";
    const limited = await consumeProfileRateLimit({
      userId: viewerId,
      ip: clientIp,
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
