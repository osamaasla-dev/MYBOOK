import Link from "next/link";

import { cn } from "@/lib/utils";
import type {
  FollowNotificationMetadata,
  NotificationListItem,
} from "@/features/parts/notifications/types";
import { FollowRequestActions } from "@/features/parts/follow/components/FollowRequestActions";

type NotificationItemProps = {
  notification: NotificationListItem;
  onSelect?: (notification: NotificationListItem) => void;
};

export function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const metadata = notification.metadata as FollowNotificationMetadata | null;
  const followerUsername =
    metadata?.followerUsername ?? notification.actor?.username ?? "";
  const followerName = metadata?.followerName ?? notification.actor?.name;
  const initials = followerUsername?.charAt(0).toUpperCase() ?? "؟";
  const profileHref = followerUsername
    ? `/user/profile/${encodeURIComponent(followerUsername)}`
    : "#";

  const kindLabel = (() => {
    switch (metadata?.kind) {
      case "request":
        return "requested to follow you";
      case "request-approved":
        return "follow request approved";
      default:
        return "followed you";
    }
  })();

  return (
    <li
      role="listitem"
      data-testid="navbar-notification-item"
      className="border-b border-border/40 last:border-none"
    >
      <Link
        href={profileHref}
        className="flex gap-3 px-4 py-3 transition hover:bg-accent/40"
        aria-label={
          followerName || followerUsername
            ? `${followerName || followerUsername} ${kindLabel}`
            : "follow notification"
        }
        onClick={() => onSelect?.(notification)}
      >
        <div
          className="relative h-10 w-10 shrink-0"
          data-testid="navbar-notification-avatar"
        >
          {notification.actor?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={notification.actor.avatarUrl}
              alt={followerUsername || "notification"}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1" data-testid="navbar-notification-body">
          <p className="text-sm font-medium text-foreground">
            {followerName || followerUsername || "user"}
            <span className="font-normal text-muted-foreground">
              {" "}
              {kindLabel}
            </span>
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            <div>{new Date(notification.createdAt).toLocaleString()}</div>
            {metadata?.status && (
              <div
                className={cn(
                  "font-semibold uppercase tracking-wide text-right",
                  metadata.status === "pending" && "text-primary",
                  metadata.status === "accepted" && "text-emerald-500",
                  metadata.status === "rejected" && "text-danger"
                )}
              >
                {metadata.status}
              </div>
            )}
          </div>
        </div>

        {!notification.isRead && (
          <span
            className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-label="notification unread"
          />
        )}
      </Link>

      {metadata?.status === "pending" && followerUsername && (
        <div className="px-4 pb-4">
          <FollowRequestActions username={followerUsername} />
        </div>
      )}
    </li>
  );
}
