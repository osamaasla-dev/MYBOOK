import { type RefObject } from "react";
import { Loader2 } from "lucide-react";

import type { NotificationListItem } from "@/features/parts/notifications/types";

import { NotificationItem } from "./NotificationItem";
import { QueryError, QueryLoading, EmptyState } from "@/components";

type NotificationListProps = {
  items: NotificationListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onRetry: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onSelectNotification: (notification: NotificationListItem) => void;
  testId?: string;
};

export function NotificationList({
  items,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  onRetry,
  listRef,
  sentinelRef,
  onSelectNotification,
  testId = "navbar-notifications",
}: NotificationListProps) {
  const showEmptyState = !isLoading && !isError && items.length === 0;

  return (
    <div
      ref={listRef}
      className="max-h-80 overflow-y-auto"
      role="region"
      aria-live="polite"
      aria-busy={isLoading || isFetchingNextPage}
      aria-label="Notifications list"
      data-testid={testId}
    >
      {isLoading && (
        <QueryLoading
          message="Loading notifications..."
          testId={`${testId}-loading`}
        />
      )}

      {isError && (
        <QueryError
          message={errorMessage}
          onRetry={onRetry}
          testId={`${testId}-error`}
        />
      )}

      {showEmptyState && (
        <EmptyState
          title="No new notifications"
          message="You're all caught up!"
          testId={`${testId}-empty`}
        />
      )}

      <ul
        role="list"
        aria-label="Notification items"
        data-testid={`${testId}-list`}
      >
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={onSelectNotification}
            testId={`${testId}-item-${notification.id}`}
          />
        ))}
      </ul>

      {isFetchingNextPage && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground"
          data-testid={`${testId}-fetching-more`}
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Loading more...
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div
          className="px-4 py-3 text-center text-xs text-muted-foreground"
          data-testid={`${testId}-end`}
          role="status"
          aria-live="polite"
        >
          No more notifications.
        </div>
      )}

      <div
        ref={sentinelRef}
        className="h-1 w-full"
        aria-hidden="true"
        data-testid={`${testId}-sentinel`}
      />
    </div>
  );
}
