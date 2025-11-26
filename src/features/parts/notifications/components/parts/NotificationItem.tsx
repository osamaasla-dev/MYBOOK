import Link from "next/link";

import { cn } from "@/lib/utils";
import type { NotificationListItem } from "@/features/parts/notifications/types";
import { getNotificationPresentation } from "@/features/parts/notifications/utils/presentation";
import { FollowRequestActions } from "@/features/parts/follow/components/FollowRequestActions";

type NotificationItemProps = {
  notification: NotificationListItem;
  onSelect?: (notification: NotificationListItem) => void;
};

export function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const presentation = getNotificationPresentation(notification);
  const fallbackUsername = notification.actor?.username ?? "";
  const fallbackName = notification.actor?.name ?? (fallbackUsername || "user");

  const profileHref =
    presentation?.profileHref ??
    (fallbackUsername
      ? `/user/profile/${encodeURIComponent(fallbackUsername)}`
      : "#");
  const title = presentation?.title ?? fallbackName;
  const subtitle = presentation?.subtitle ?? "sent you a notification";
  const initials =
    presentation?.initials ?? fallbackUsername?.charAt(0).toUpperCase() ?? "؟";
  const statusLabel = presentation?.statusLabel;
  const statusTone = presentation?.statusTone;
  const action = presentation?.action;

  const actionContent = (() => {
    if (!action) return null;

    switch (action.kind) {
      case "follow-request":
        return (
          <FollowRequestActions
            username={action.username}
            layout="row"
            className="w-full"
          />
        );
      default:
        return null;
    }
  })();

  return (
    <li
      role="listitem"
      data-testid="navbar-notification-item"
      className="border-b border-border/40 last:border-none"
    >
      <div className="flex flex-col gap-3 px-4 py-3 transition hover:bg-accent/40">
        <Link
          href={profileHref}
          className="flex gap-3"
          aria-label={`${title} ${subtitle}`.trim() || "notification"}
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
                alt={fallbackUsername || "notification"}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>

          <div
            className="min-w-0 flex-1"
            data-testid="navbar-notification-body"
          >
            <p className="text-sm font-medium text-foreground">
              {title}
              <span className="font-normal text-muted-foreground">
                {" "}
                {subtitle}
              </span>
            </p>
            <div className="mt-1 text-xs text-muted-foreground">
              <div>{new Date(notification.createdAt).toLocaleString()}</div>
              {statusLabel && (
                <div
                  className={cn(
                    "font-semibold uppercase tracking-wide text-right",
                    statusTone === "primary" && "text-primary",
                    statusTone === "success" && "text-emerald-500",
                    statusTone === "danger" && "text-danger"
                  )}
                >
                  {statusLabel}
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

        {actionContent && actionContent}
      </div>
    </li>
  );
}
