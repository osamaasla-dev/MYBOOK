"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useCurrentUser } from "@/features/hooks";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationsRealtime } from "../hooks/useNotificationsRealtime";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { NotificationListItem } from "../types";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";
import { useRealtimeNotificationToasts } from "../hooks/toasts/useRealtimeNotificationToasts";
import type { NotificationTab } from "../constants";
import { NOTIFICATION_PAGE_SIZE } from "../constants";
import { notificationsQueryKey } from "../hooks/useNotifications";

import {
  NotificationBellButton,
  NotificationList,
  NotificationDropdownHeader,
} from "./parts";

export function Notifications() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [currentTab, setCurrentTab] = useState<NotificationTab>("all");
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useNotifications({
    initialLimit: NOTIFICATION_PAGE_SIZE,
    tab: currentTab,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items]
  );

  const subscriptionChannel = currentUser?.id
    ? `private-user-${currentUser.id}`
    : "";

  const markNotificationMutation = useMarkNotificationRead();

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: notificationsQueryKey(currentTab),
    });
  }, [queryClient, currentTab]);

  useNotificationsRealtime(
    subscriptionChannel,
    Boolean(subscriptionChannel),
    invalidateNotifications
  );

  useRealtimeNotificationToasts();

  useInfiniteScroll({
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
    rootMargin: "0px 0px 300px 0px",
  });
  const handleNotificationSelect = useCallback(
    (notification: NotificationListItem) => {
      setIsDropdownOpen(false);

      if (!notification.id || notification.isRead) {
        return;
      }
      markNotificationMutation.mutate(notification.id);
    },
    [markNotificationMutation]
  );

  const handleTabChange = useCallback(
    (tab: NotificationTab) => {
      if (tab === currentTab) return;
      setCurrentTab(tab);
    },
    [currentTab]
  );

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <NotificationBellButton
          isBusy={isFetching}
          unreadCount={unreadCount}
          isOpen={isDropdownOpen}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-white p-0"
        sideOffset={12}
        data-testid="navbar-notifications-dropdown"
      >
        <NotificationDropdownHeader
          onRefresh={refetch}
          tab={currentTab}
          onTabChange={handleTabChange}
        />

        <NotificationList
          items={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onRetry={refetch}
          listRef={listRef}
          sentinelRef={sentinelRef}
          onSelectNotification={handleNotificationSelect}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Notifications;
