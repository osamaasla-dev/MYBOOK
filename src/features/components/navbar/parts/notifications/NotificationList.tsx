import { Loader2 } from "lucide-react";

import type { NotificationListItem } from "@/features/parts/notifications/types";

import { NotificationItem } from "./NotificationItem";
import { QueryError, QueryLoading } from "@/components";

type NotificationListProps = {
  items: NotificationListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onRetry: () => void;
  onScroll: React.UIEventHandler<HTMLDivElement>;
};

export function NotificationList({
  items,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  onRetry,
  onScroll,
}: NotificationListProps) {
  const showEmptyState = !isLoading && !isError && items.length === 0;

  return (
    <div
      className="max-h-80 overflow-y-auto"
      onScroll={onScroll}
      role="region"
      aria-live="polite"
      aria-busy={isLoading || isFetchingNextPage}
      data-testid="navbar-notifications-scroll"
    >
      {isLoading && <QueryLoading />}

      {isError && <QueryError message={errorMessage} onRetry={onRetry} />}

      {showEmptyState && (
        <div
          className="px-4 py-10 text-center text-sm text-muted-foreground"
          data-testid="navbar-notifications-empty"
        >
          No new notifications.
        </div>
      )}

      <ul
        role="list"
        aria-label="Notification list"
        data-testid="navbar-notifications-list"
      >
        {items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </ul>

      {isFetchingNextPage && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground"
          data-testid="navbar-notifications-fetching-more"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Loading more...
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div
          className="px-4 py-3 text-center text-xs text-muted-foreground"
          data-testid="navbar-notifications-end"
        >
          No more notifications.
        </div>
      )}
    </div>
  );
}
