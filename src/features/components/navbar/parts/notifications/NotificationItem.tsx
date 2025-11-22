import Link from "next/link";

import type { NotificationListItem } from "@/features/parts/notifications/types";

export type FollowNotificationMetadata = {
  followerUsername: string;
  followerName: string | null;
  targetUsername: string;
  targetName: string | null;
  occurredAt: string;
};

type NotificationItemProps = {
  notification: NotificationListItem;
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const metadata = notification.metadata as FollowNotificationMetadata | null;
  const followerUsername =
    metadata?.followerUsername ?? notification.actor?.username ?? "";
  const followerName = metadata?.followerName ?? notification.actor?.name;
  const initials = followerUsername?.charAt(0).toUpperCase() ?? "؟";
  const profileHref = followerUsername
    ? `/user/profile/${encodeURIComponent(followerUsername)}`
    : "#";

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
            ? `${followerName || followerUsername} follow you`
            : "follow notification"
        }
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
              follow you
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        {!notification.isRead ? (
          <span
            className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-label="notification unread"
          />
        ) : null}
      </Link>
    </li>
  );
}
