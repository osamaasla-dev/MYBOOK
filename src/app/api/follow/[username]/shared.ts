import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import type { Logger } from "pino";

import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import {
  normalizeFollowUsername,
  validateFollowTarget,
} from "@/features/parts/follow/utils";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import { isBlock } from "@/features/parts/block/utils/server";
import {
  FOLLOW_RATE_MAX,
  FOLLOW_RATE_NAMESPACE,
  FOLLOW_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";
import type { ProfileUserRecord } from "@/features/pages/profile/types";

export type FollowRouteParams = { username?: string };

export type FollowRouteContext = {
  params: Promise<FollowRouteParams>;
};

export type PreparedFollowAction = {
  requestId: string;
  log: Logger;
  viewerId: string;
  viewerName: string;
  viewerUsername: string;
  target: ProfileUserRecord;
  requiresApproval: boolean;
};

type FollowActionKind =
  | "follow"
  | "unfollow"
  | "cancel-request"
  | "accept-request"
  | "reject-request"
  | "remove-follower";

type PrepareFollowActionOptions = {
  route: string;
  action: FollowActionKind;
};

type PrepareFollowActionResult =
  | { ok: true; context: PreparedFollowAction }
  | { ok: false; response: Response };

export async function prepareFollowAction(
  request: Request,
  paramsPromise: FollowRouteContext["params"],
  options: PrepareFollowActionOptions
): Promise<PrepareFollowActionResult> {
  const { requestId, log } = await getRequestLog({ route: options.route });
  const actionLabelMap: Record<FollowActionKind, string> = {
    follow: "Follow",
    unfollow: "Unfollow",
    "cancel-request": "Cancel follow request",
    "accept-request": "Accept follow request",
    "reject-request": "Reject follow request",
    "remove-follower": "Remove follower",
  };
  const actionLabel = actionLabelMap[options.action];

  try {
    log.info(`${actionLabel} request started`);
    const session = await validateSession(log, requestId);
    if (!session.ok) return { ok: false, response: session.response };
    const viewer = session.user;
    const params = await paramsPromise;

    const limited = await checkRateLimit({
      namespace: FOLLOW_RATE_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: FOLLOW_RATE_WINDOW_SECONDS,
      maxRequests: FOLLOW_RATE_MAX,
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

    const viewerUsername = viewer.username;
    const viewerName = viewer.name ?? "";
    if (!viewerUsername) {
      log.error("Viewer record missing");
      return {
        ok: false,
        response: apiResponse(false, {}, userMessages.failed, 500, requestId),
      };
    }

    const normalizedUsername = normalizeFollowUsername(params.username);
    if (!normalizedUsername) {
      log.warn(`Invalid ${options.action} params`);
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
    const validation = validateFollowTarget(targetProfile, viewer.id);
    if (!validation.ok) {
      switch (validation.reason) {
        case "NOT_FOUND": {
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
        case "SELF": {
          log.warn("Viewer attempted to follow self");
          return {
            ok: false,
            response: apiResponse(
              false,
              {},
              "FOLLOW_SELF_NOT_ALLOWED",
              400,
              requestId
            ),
          };
        }
      }
    }

    const { profile: target, requiresApproval } = validation;

    const blockStatus = await isBlock(viewer.id, target.id);

    if (blockStatus.anyBlock) {
      log.warn(
        { viewerId: viewer.id, targetId: target.id },
        `${actionLabel} blocked due to existing block`
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
        target,
        requiresApproval,
      },
    };
  } catch (error) {
    log.error({ error }, `${actionLabel} prechecks failed`);
    return {
      ok: false,
      response: apiResponse(false, {}, userMessages.failed, 500, requestId),
    };
  }
}
