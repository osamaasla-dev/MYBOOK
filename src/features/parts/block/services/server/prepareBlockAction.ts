import { apiResponse } from "@/lib/apiResponse";
import { blockMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import type { Logger } from "pino";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import {
  BLOCK_RATE_LIMIT_NAMESPACE,
  BLOCK_RATE_MAX_REQUESTS,
  BLOCK_RATE_WINDOW_SECONDS,
} from "@/features/parts/ratelimit/constants";
import { isBlock } from "@/features/parts/block/utils/server";
import type { ProfileUserRecord } from "@/features/pages/profile/types";

export type PreparedBlockAction = {
  requestId: string;
  log: Logger;
  viewer: {
    id: string;
    username: string;
  };
  target: ProfileUserRecord;
};

type PrepareBlockActionOptions = {
  route: string;
  action: "block" | "unblock";
};

type PrepareBlockActionResult =
  | { ok: true; context: PreparedBlockAction }
  | { ok: false; response: Response };

export async function prepareBlockAction(
  request: Request,
  params: Promise<{ username: string }>,
  options: PrepareBlockActionOptions
): Promise<PrepareBlockActionResult> {
  const { requestId, log } = await getRequestLog({ route: options.route });

  try {
    log.info(`${options.action} request started`);
    const session = await validateSession(log, requestId);
    if (!session.ok) return { ok: false, response: session.response };
    const viewer = session.user;
    const { username } = await params;

    const limited = await checkRateLimit({
      namespace: BLOCK_RATE_LIMIT_NAMESPACE,
      viewerId: viewer.id,
      windowSeconds: BLOCK_RATE_WINDOW_SECONDS,
      maxRequests: BLOCK_RATE_MAX_REQUESTS,
      log,
      request,
      requestId,
    });

    if (!limited.ok) {
      return { ok: false, response: limited.response };
    }

    const targetProfile = await fetchProfileUserByUsername(username);
    if (!targetProfile) {
      log.warn("Target profile not found");
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          blockMessages.ERRORS.targetNotFound,
          404,
          requestId
        ),
      };
    }

    if (targetProfile.id === viewer.id) {
      log.warn(`Viewer attempted to ${options.action} self`);
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          blockMessages.ERRORS.selfBlock,
          400,
          requestId
        ),
      };
    }

    const blockStatus = await isBlock(viewer.id, targetProfile.id);

    // Validate block status based on action
    if (options.action === "block" && blockStatus.anyBlock) {
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          blockMessages.ERRORS.alreadyBlocked,
          400,
          requestId
        ),
      };
    }

    if (options.action === "unblock" && !blockStatus.primaryBlocksSecondary) {
      log.warn(
        { viewerId: viewer.id, targetId: targetProfile.id },
        "Viewer attempted to unblock user they have not blocked"
      );
      return {
        ok: false,
        response: apiResponse(
          false,
          {},
          blockMessages.ERRORS.notBlocked,
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
        viewer: {
          id: viewer.id,
          username: viewer.username,
        },
        target: targetProfile,
      },
    };
  } catch (error) {
    log.error({ error }, `${options.action} preparation failed`);
    return {
      ok: false,
      response: apiResponse(
        false,
        {},
        blockMessages.ERRORS.unexpected,
        500,
        requestId
      ),
    };
  }
}
