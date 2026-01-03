import type { NotificationListItem } from "@/features/parts/notifications/types";

type NotificationAvatarProps = {
  notification: NotificationListItem;
  initials: string;
  fallbackUsername: string;
};

export function NotificationAvatar({
  notification,
  initials,
  fallbackUsername,
}: NotificationAvatarProps) {
  const avatarUrl = notification.actor?.avatarUrl;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fallbackUsername || "notification"}
        className="h-full w-full rounded-full object-cover"
        referrerPolicy="no-referrer"
        data-testid="navbar-notification-avatar-image"
      />
    );
  }

  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
      data-testid="navbar-notification-avatar-initials"
    >
      {initials}
    </span>
  );
}
