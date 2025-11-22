"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useCurrentUser } from "@/features/hooks/useCurrentUser";
import { useNotifications } from "@/features/parts/notifications/hooks/useNotifications";
import { usePusherChannel } from "@/hooks/usePusherChannel";

import { NotificationBellButton } from "./notifications/NotificationBellButton";
import { NotificationList } from "./notifications/NotificationList";

export function NavbarNotifications() {
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

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items]
  );

  const subscriptionChannel = currentUser?.id
    ? `private-user-${currentUser.id}`
    : "";

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["notifications", { unreadOnly: false }],
    });
  }, [queryClient]);

  usePusherChannel({
    channelName: subscriptionChannel,
    event: "follow:added",
    enabled: Boolean(subscriptionChannel),
    onEvent: invalidateNotifications,
  });

  usePusherChannel({
    channelName: subscriptionChannel,
    event: "follow:removed",
    enabled: Boolean(subscriptionChannel),
    onEvent: invalidateNotifications,
  });

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceToBottom < 64) {
      fetchNextPage();
    }
  };

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
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          data-testid="navbar-notifications-header"
        >
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            type="button"
            onClick={() => refetch()}
            variant="link"
            data-testid="navbar-notifications-refresh"
          >
            Refresh
          </Button>
        </div>

        <NotificationList
          items={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onRetry={refetch}
          onScroll={handleScroll}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavbarNotifications;
