import { apiGetR, apiPostR } from "@/lib/api";
import { DEFAULT_NOTIFICATIONS_LIMIT } from "../../schema";
import type { NotificationListResult } from "../../types";
import type { NotificationTab } from "../../constants";

export type NotificationsApiParams = {
  limit?: number;
  cursor?: string;
  tab?: NotificationTab;
};

const buildNotificationsQuery = ({
  limit,
  cursor,
  tab,
}: NotificationsApiParams = {}): string => {
  const params = new URLSearchParams();

  const resolvedLimit = limit ?? DEFAULT_NOTIFICATIONS_LIMIT;
  if (resolvedLimit) {
    params.set("limit", String(resolvedLimit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (tab) {
    params.set("tab", tab);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export async function fetchNotificationsPage(
  params: NotificationsApiParams = {}
): Promise<NotificationListResult> {
  const query = buildNotificationsQuery(params);
  const { data } = await apiGetR<NotificationListResult>(
    `/notifications${query}`
  );

  return data;
}

////////////////////////////////////////////////////

export async function markNotificationAsReadRequest(notificationId: string) {
  const { data, message } = await apiPostR<{ updated: number }>(
    `/notifications/${encodeURIComponent(notificationId)}/mark-read`
  );

  return {
    updated: data.updated,
    message,
  };
}
