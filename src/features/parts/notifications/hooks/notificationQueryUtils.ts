"use client";

import type { QueryClient } from "@tanstack/react-query";

import { NOTIFICATION_TAB_VALUES, type NotificationTab } from "../constants";
import { notificationsQueryKey } from "./useNotifications";

export function invalidateNotificationTabQueries(
  queryClient: QueryClient,
  tabs: NotificationTab[] = [...NOTIFICATION_TAB_VALUES]
) {
  tabs.forEach((tab) => {
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey(tab) });
  });
}
