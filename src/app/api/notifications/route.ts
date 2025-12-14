import { apiResponse } from "@/lib/apiResponse";
import { normalizeError } from "@/lib/http/normalizeError";
import { notificationMessages } from "@/lib/messages";
import { getRequestLog } from "@/lib/request-log";
import { ServerSession } from "@/utils/session";
import { fetchUserNotifications } from "@/features/parts/notifications/services/server";
import { parseNotificationListQuery } from "@/features/parts/notifications/utils";

const ROUTE = "/api/notifications";

export async function GET(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    log.info("Notifications fetch started");
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

    const url = new URL(request.url);
    const parsedQuery = parseNotificationListQuery(url.searchParams);

    if (!parsedQuery.ok) {
      log.warn({ reason: parsedQuery.message }, "Invalid notifications query");
      return apiResponse(
        false,
        {},
        notificationMessages.invalidParams,
        400,
        requestId
      );
    }

    const { limit, cursor, tab } = parsedQuery.value;

    const notifications = await fetchUserNotifications({
      userId: session.user.id,
      limit,
      cursor,
      tab,
    });

    log.info(
      { userId: session.user.id, count: notifications.items.length },
      notificationMessages.fetchSuccess
    );

    return apiResponse(
      true,
      notifications,
      notificationMessages.fetchSuccess,
      200,
      requestId
    );
  } catch (err) {
    const error = normalizeError(err);
    log.error({ err, status: error.status }, notificationMessages.fetchFailed);
    return apiResponse(
      false,
      {},
      error.message ?? notificationMessages.fetchFailed,
      error.status ?? 500,
      requestId
    );
  }
}
