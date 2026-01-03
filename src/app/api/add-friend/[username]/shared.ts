import { apiResponse } from "@/lib/apiResponse";
import { friendMessages, userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import type { Logger } from "pino";

import {
  FRIEND_REQUEST_RATE_NAMESPACE,
  FRIEND_REQUEST_RATE_WINDOW_SECONDS,
  FRIEND_REQUEST_RATE_MAX,
} from "@/features/parts/ratelimit/constants";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import type { ProfileUserRecord } from "@/features/pages/profile/types";
import { usernameSchema } from "@/features/pages/profile/types";
import { isBlock } from "@/features/parts/block/utils/server";

import { checkRateLimit } from "@/features/parts/ratelimit/services";
import { validateSession } from "@/features/services/server";

export type FriendRouteParams = { username?: string };

export type FriendRouteContext = {
  params: Promise<FriendRouteParams>;
};

export type PreparedFriendAction = {
  requestId: string;
  log: Logger;
  viewerId: string;
  viewerName: string;
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
    const session = await validateSession(log, requestId);
    if (!session.ok) return { ok: false, response: session.response };
    const viewer = session.user;
    const params = await paramsPromise;

    const limited = await checkRateLimit({
      namespace: FRIEND_REQUEST_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: FRIEND_REQUEST_RATE_WINDOW_SECONDS,
      maxRequests: FRIEND_REQUEST_RATE_MAX,
      log,
      request,
      requestId,
    });
    if (!limited.ok) {
      return {
        ok: false,
        response: limited.response,
      };
    }

    const viewerUsername = viewer?.username;
    const viewerName = viewer?.name || "";
    if (!viewerUsername) {
      log.error("Viewer record missing");
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
    const validation = validateFriendTarget(targetProfile, viewer.id);

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

    const blockStatus = await isBlock(viewer.id, validation.profile.id);

    if (blockStatus.anyBlock) {
      log.warn(
        { viewerId: viewer.id, targetId: validation.profile.id },
        "Friend action blocked due to existing block"
      );
      return {
        ok: false,
        response: apiResponse(false, {}, userMessages.notFound, 404, requestId),
      };
    }

    return {
      ok: true,
      context: {
        requestId,
        log,
        viewerId: viewer.id,
        viewerName,
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
