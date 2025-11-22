import { apiGetR } from "@/lib/api";
import { DEFAULT_NOTIFICATIONS_LIMIT } from "../schema";
import type { NotificationListResult } from "../types";

export type NotificationsApiParams = {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
};

const buildNotificationsQuery = ({
  limit,
  cursor,
  unreadOnly,
}: NotificationsApiParams = {}): string => {
  const params = new URLSearchParams();

  const resolvedLimit = limit ?? DEFAULT_NOTIFICATIONS_LIMIT;
  if (resolvedLimit) {
    params.set("limit", String(resolvedLimit));
  }

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (typeof unreadOnly === "boolean") {
    params.set("unreadOnly", unreadOnly ? "true" : "false");
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
