"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchNotificationsPage } from "../services";
import type { NotificationListItem, NotificationListResult } from "../types";

export type UseNotificationsOptions = {
  unreadOnly?: boolean;
  initialLimit?: number;
  enabled?: boolean;
};

export type NotificationsQueryData = {
  pages: NotificationListResult[];
  pageParams: Array<string | undefined>;
  items: NotificationListItem[];
  hasMore: boolean;
};

export function useNotifications({
  unreadOnly = false,
  initialLimit,
  enabled = true,
}: UseNotificationsOptions = {}) {
  return useInfiniteQuery<
    NotificationListResult,
    Error,
    NotificationsQueryData,
    ["notifications", { unreadOnly: boolean }]
  >({
    queryKey: ["notifications", { unreadOnly }],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchNotificationsPage({
        cursor: pageParam as string | undefined,
        unreadOnly,
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
  });
}
