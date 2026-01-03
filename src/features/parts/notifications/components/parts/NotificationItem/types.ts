import type { NotificationListItem } from "@/features/parts/notifications/types";

export type NotificationItemProps = {
  notification: NotificationListItem;
  onSelect?: (notification: NotificationListItem) => void;
  testId?: string;
};

export type NotificationData = {
  presentation: ReturnType<
    typeof import("@/features/parts/notifications/utils/presentation").getNotificationPresentation
  >;
  fallbackUsername: string;
  fallbackName: string;
  profileHref: string;
  title: string;
  subtitle: string;
  initials: string;
  statusLabel?: string;
  statusTone?: "primary" | "success" | "danger";
  action?: {
    kind: "follow-request" | "friend-request";
    username: string;
  };
  postId: string | null;
};
