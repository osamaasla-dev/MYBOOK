import { apiResponse } from "@/lib/apiResponse";
import { friendMessages, userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import type { Logger } from "pino";

import {
  consumeProfileRateLimit,
  fetchProfileUserByUsername,
  getViewerSession,
} from "@/features/pages/profile/utils";
import type { ProfileUserRecord } from "@/features/pages/profile/types";
import { usernameSchema } from "@/features/pages/profile/types";
import {
  extractClientIp,
  fetchViewerUsername,
} from "@/features/parts/follow/utils";

export type FriendRouteParams = { username?: string };

export type FriendRouteContext = {
  params: Promise<FriendRouteParams>;
};

export type PreparedFriendAction = {
  requestId: string;
  log: Logger;
  viewerId: string;
  viewerUsername: string;
  target: ProfileUserRecord;
};

export async function prepareFriendAction(
  request: Request,
  paramsPromise: FriendRouteContext["params"],
  route: string
): Promise<
  | { ok: true; context: PreparedFriendAction }
  | { ok: false; response: Response }
> {
  const { requestId, log } = await getRequestLog({ route });

  try {
    log.info("Friend request started");
    const { viewerId } = await getViewerSession();
    const clientIp = extractClientIp(request);
    const params = await paramsPromise;

    const limited = await consumeProfileRateLimit({
      userId: viewerId,
      ip: clientIp,
    });

    if (limited) {
      log.warn({ viewerId, clientIp }, "Friend request rate-limited");
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          userMessages.rateLimited,
          429,
          requestId
        ),
      };
    }

    if (!viewerId) {
      log.warn("Friend request unauthorized");
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          userMessages.unauthorized,
          401,
          requestId
        ),
      };
    }

    const viewerUsername = await fetchViewerUsername(viewerId);
    if (!viewerUsername) {
      log.error({ viewerId }, "Viewer record missing");
      return {
        ok: false,
        response: apiResponse(false, {}, userMessages.failed, 500, requestId),
      };
    }

    const normalizedUsername = normalizeFriendUsername(params.username);
    if (!normalizedUsername) {
      log.warn("Invalid friend params");
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          userMessages.invalidParams,
          400,
          requestId
        ),
      };
    }

    const targetProfile = await fetchProfileUserByUsername(normalizedUsername);
    const validation = validateFriendTarget(targetProfile, viewerId);

    if (!validation.ok) {
      if (validation.reason === "NOT_FOUND") {
        log.warn("Target profile not found");
        return {
          ok: false,
          response: apiResponse(
            false,
            {},
            userMessages.notFound,
            404,
            requestId
          ),
        };
      }

      log.warn("Viewer attempted to friend self");
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          friendMessages.FRIEND_ERRORS.selfFriend,
          400,
          requestId
        ),
      };
    }

    return {
      ok: true,
      context: {
        requestId,
        log,
        viewerId,
        viewerUsername,
        target: validation.profile,
      },
    };
  } catch (error) {
    log.error({ error }, "Friend request prechecks failed");
    return {
      ok: false,
      response: apiResponse(false, {}, userMessages.failed, 500, requestId),
    };
  }
}

function normalizeFriendUsername(username?: string): string | null {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return null;
  }
  return parsed.data.toLowerCase();
}

function validateFriendTarget(
  profile: ProfileUserRecord | null,
  viewerId: string
):
  | { ok: true; profile: ProfileUserRecord }
  | { ok: false; reason: "NOT_FOUND" | "SELF" } {
  if (!profile) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (profile.id === viewerId) {
    return { ok: false, reason: "SELF" };
  }

  return { ok: true, profile };
}
