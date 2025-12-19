import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import type { Logger } from "pino";

import {
  fetchProfileUserByUsername,
  getViewerSession,
} from "@/features/pages/profile/utils";
import {
  fetchViewerUsername,
  normalizeFollowUsername,
  validateFollowTarget,
} from "@/features/parts/follow/utils";
import { extractClientIp } from "@/features/parts/follow/utils/request";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import {
  PROFILE_RATE_MAX,
  PROFILE_RATE_NAMESPACE,
  PROFILE_RATE_WINDOW_SECONDS,
} from "@/features/pages/profile/constants";
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
    const { viewerId } = await getViewerSession();
    const clientIp = extractClientIp(request);
    const params = await paramsPromise;

    const limited = await consumeRateLimit({
      namespace: PROFILE_RATE_NAMESPACE,
      identifiers: [
        { key: "user", value: viewerId },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: PROFILE_RATE_WINDOW_SECONDS,
      maxRequests: PROFILE_RATE_MAX,
    });

    // if (limited) {
    //   log.warn({ viewerId, clientIp }, `${actionLabel} request rate-limited`);
    //   return {
    //     ok: false,
    //     response: apiResponse(
    //       false,
    //       {},
    //       userMessages.rateLimited,
    //       429,
    //       requestId
    //     ),
    //   };
    // }

    if (!viewerId) {
      log.warn(`${actionLabel} request unauthorized`);
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
    const viewer = await fetchViewerUsername(viewerId);
    const viewerUsername = viewer?.username;
    const viewerName = viewer?.name ?? "";
    if (!viewerUsername) {
      log.error({ viewerId }, "Viewer record missing");
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
    const validation = validateFollowTarget(targetProfile, viewerId);
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

    return {
      ok: true,
      context: {
        requestId,
        log,
        viewerId,
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
