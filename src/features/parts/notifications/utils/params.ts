import {
  type NotificationListQuery,
  notificationListQuerySchema,
} from "../schema";

export type NotificationListQueryResult =
  | { ok: true; value: NotificationListQuery }
  | { ok: false; message: string };

export function parseNotificationListQuery(
  searchParams: URLSearchParams
): NotificationListQueryResult {
  const data = Object.fromEntries(searchParams.entries());
  const parsed = notificationListQuerySchema.safeParse(data);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "INVALID" };
  }

  return {
    ok: true,
    value: parsed.data,
  };
}
