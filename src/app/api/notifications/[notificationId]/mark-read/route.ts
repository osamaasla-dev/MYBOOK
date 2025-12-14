import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { notificationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { markNotificationAsRead } from "@/features/parts/notifications/services/server";

const ROUTE = "/api/notifications/[notificationId]/mark-read";

type RouteParams = {
  params: {
    notificationId?: string;
  };
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

    const session = await ServerSession();

    if (!session?.user?.id) {
      log.warn(notificationMessages.unauthorized);
      return apiResponse(
        false,
        {},
        notificationMessages.unauthorized,
        401,
        requestId
      );
    }

    const result = await markNotificationAsRead(
      session.user.id,
      notificationId
    );

    log.info(
      { userId: session.user.id, notificationId, updated: result.count },
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
