import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { blockMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import { extractClientIp } from "@/features/parts/follow/utils/request";
import { consumeRateLimit } from "@/features/utils/rateLimit";
import {
  BLOCK_RATE_LIMIT_NAMESPACE,
  BLOCK_RATE_MAX_REQUESTS,
  BLOCK_RATE_WINDOW_SECONDS,
} from "@/features/parts/block/constants/rateLimit";
import { blockUser, unblockUser } from "@/features/parts/block/services/server";
import { isBlock } from "@/features/parts/block/utils/server";
import { ServerSession } from "@/utils/session";

const ROUTE = "/api/block/[username]";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Block request started");
    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(blockMessages.ERRORS.unauthorized);
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.unauthorized,
        401,
        requestId
      );
    }
    const { username } = await params;

    const viewer = session?.user;
    const viewerId = viewer.id;

    const clientIp = extractClientIp(request);
    const limited = await consumeRateLimit({
      namespace: BLOCK_RATE_LIMIT_NAMESPACE,
      identifiers: [
        { key: "user", value: viewer.id },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: BLOCK_RATE_WINDOW_SECONDS,
      maxRequests: BLOCK_RATE_MAX_REQUESTS,
    });

    if (limited) {
      log.warn({ viewerId, clientIp }, "Block request rate-limited");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.rateLimited,
        429,
        requestId
      );
    }

    const targetProfile = await fetchProfileUserByUsername(username);
    if (!targetProfile) {
      log.warn("Target profile not found");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.targetNotFound,
        404,
        requestId
      );
    }

    if (targetProfile.id === viewer.id) {
      log.warn("Viewer attempted to block self");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.selfBlock,
        400,
        requestId
      );
    }

    const blockStatus = await isBlock(viewerId, targetProfile.id);
    if (blockStatus.anyBlock) {
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.alreadyBlocked,
        400,
        requestId
      );
    }

    const blockResult = await blockUser({
      viewerId,
      viewerUsername: viewer.username,
      targetProfile: {
        id: targetProfile.id,
        username: targetProfile.username,
      },
    });

    log.info(
      { blockedUserId: blockResult.blockedUserId },
      "User blocked successfully"
    );

    return apiResponse(
      true,
      { blockedUserId: blockResult.blockedUserId },
      blockMessages.FEEDBACK.success,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Block request failed");
    return apiResponse(
      false,
      {},
      error.message ?? blockMessages.ERRORS.unexpected,
      error.status ?? 500,
      requestId
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Unblock request started");
    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(blockMessages.ERRORS.unauthorized);
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.unauthorized,
        401,
        requestId
      );
    }
    const { username } = await params;

    const viewer = session.user;
    const viewerId = viewer.id;

    const clientIp = extractClientIp(request);
    const limited = await consumeRateLimit({
      namespace: BLOCK_RATE_LIMIT_NAMESPACE,
      identifiers: [
        { key: "user", value: viewer.id },
        { key: "ip", value: clientIp },
      ],
      windowSeconds: BLOCK_RATE_WINDOW_SECONDS,
      maxRequests: BLOCK_RATE_MAX_REQUESTS,
    });

    if (limited) {
      log.warn({ viewerId, clientIp }, "Unblock request rate-limited");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.rateLimited,
        429,
        requestId
      );
    }

    const targetProfile = await fetchProfileUserByUsername(username);
    if (!targetProfile) {
      log.warn("Target profile not found for unblock");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.targetNotFound,
        404,
        requestId
      );
    }

    if (targetProfile.id === viewer.id) {
      log.warn("Viewer attempted to unblock self");
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.selfBlock,
        400,
        requestId
      );
    }

    const blockStatus = await isBlock(viewerId, targetProfile.id);
    if (!blockStatus.primaryBlocksSecondary) {
      log.warn(
        { viewerId, targetId: targetProfile.id },
        "Viewer attempted to unblock user they have not blocked"
      );
      return apiResponse(
        false,
        {},
        blockMessages.ERRORS.notBlocked,
        400,
        requestId
      );
    }

    const result = await unblockUser({
      viewerId,
      viewerUsername: viewer.username,
      targetProfile: {
        id: targetProfile.id,
        username: targetProfile.username,
      },
    });

    log.info(
      { unblockedUserId: result.unblockedUserId },
      "User unblocked successfully"
    );

    return apiResponse(
      true,
      { unblockedUserId: result.unblockedUserId },
      blockMessages.FEEDBACK.unblocked,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, "Unblock request failed");
    return apiResponse(
      false,
      {},
      error.message ?? blockMessages.ERRORS.unexpected,
      error.status ?? 500,
      requestId
    );
  }
}
