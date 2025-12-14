"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { NotificationListItem, NotificationListResult } from "../types";
import type { NotificationTab } from "../constants";
import { fetchNotificationsPage } from "../services/client";

export type UseNotificationsOptions = {
  tab?: NotificationTab;
  initialLimit?: number;
  enabled?: boolean;
};

export type NotificationsQueryData = {
  pages: NotificationListResult[];
  pageParams: Array<string | undefined>;
  items: NotificationListItem[];
  hasMore: boolean;
};

export const notificationsQueryKey = (tab: NotificationTab = "all") =>
  ["notifications", { tab }] as const;

export function useNotifications({
  tab = "all",
  initialLimit,
  enabled = true,
}: UseNotificationsOptions = {}) {
  const queryKey = notificationsQueryKey(tab);

  return useInfiniteQuery<
    NotificationListResult,
    Error,
    NotificationsQueryData,
    typeof queryKey
  >({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchNotificationsPage({
        cursor: pageParam as string | undefined,
        tab,
        limit: initialLimit,
      }),

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams as Array<string | undefined>,
      items: data.pages.flatMap((page) => page.items),
      hasMore:
        data.pages.length > 0
          ? data.pages[data.pages.length - 1].hasNextPage
          : false,
    }),
    refetchOnWindowFocus: true,
  });
}
