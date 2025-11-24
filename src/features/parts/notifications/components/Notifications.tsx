"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useCurrentUser } from "@/features/hooks/useCurrentUser";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationsRealtime } from "../hooks/useNotificationsRealtime";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { NotificationListItem } from "../types";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";

import {
  NotificationBellButton,
  NotificationList,
  NotificationDropdownHeader,
} from "./parts";

export function Notifications() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
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
  } = useNotifications({ initialLimit: 10 });

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
      queryKey: ["notifications", { unreadOnly: false }],
    });
  }, [queryClient]);

  useNotificationsRealtime(
    subscriptionChannel,
    Boolean(subscriptionChannel),
    invalidateNotifications
  );

  useInfiniteScroll({
    containerRef: listRef,
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
    rootMargin: "0px 0px 300px 0px",
  });

  const handleNotificationSelect = useCallback(
    (notification: NotificationListItem) => {
      if (!notification.id || notification.isRead) {
        return;
      }
      markNotificationMutation.mutate(notification.id);
    },
    [markNotificationMutation]
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
        <NotificationDropdownHeader onRefresh={refetch} />

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
