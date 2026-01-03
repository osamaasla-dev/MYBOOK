import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { notificationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";
import { markNotificationAsRead } from "@/features/parts/notifications/services/server";

const ROUTE = "/api/notifications/[notificationId]/mark-read";

type RouteParams = {
  params: Promise<{ notificationId: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("change reading status started");
    const { notificationId } = await params;

    if (!notificationId) {
      log.warn({ reason: "Missing notification id" }, "Invalid params");
      return apiResponse(
        false,
        {},
        notificationMessages.invalidParams,
        400,
        requestId
      );
    }

    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session.user;

    const result = await markNotificationAsRead(viewer.id, notificationId);

    log.info(
      { userId: viewer.id, notificationId, updated: result.count },
      notificationMessages.markReadSuccess
    );

    return apiResponse(
      true,
      { updated: result.count },
      notificationMessages.markReadSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error(
      { err, status: error.status },
      notificationMessages.markReadFailed
    );

    return apiResponse(
      false,
      {},
      error.message ?? notificationMessages.markReadFailed,
      error.status ?? 500,
      requestId
    );
  }
}
