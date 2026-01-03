import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { blockMessages } from "@/lib/messages";
import {
  blockUser,
  unblockUser,
  prepareBlockAction,
} from "@/features/parts/block/services/server";

const ROUTE = "/api/block/[username]";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const preparation = await prepareBlockAction(request, params, {
    route: ROUTE,
    action: "block",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewer, target } = preparation.context;

  try {
    const blockResult = await blockUser({
      viewerId: viewer.id,
      viewerUsername: viewer.username,
      targetProfile: {
        id: target.id,
        username: target.username,
      },
    });

    log.info(
      { blockedUserId: blockResult.blockedUserId },
      blockMessages.FEEDBACK.success
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
  const preparation = await prepareBlockAction(request, params, {
    route: ROUTE,
    action: "unblock",
  });

  if (!preparation.ok) {
    return preparation.response;
  }

  const { requestId, log, viewer, target } = preparation.context;

  try {
    const result = await unblockUser({
      viewerId: viewer.id,
      viewerUsername: viewer.username,
      targetProfile: {
        id: target.id,
        username: target.username,
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
