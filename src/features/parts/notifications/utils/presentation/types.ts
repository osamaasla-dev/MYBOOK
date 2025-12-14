import type { NotificationListItem } from "../../types";

export type NotificationAction =
  | {
      kind: "follow-request";
      username: string;
    }
  | {
      kind: "friend-request";
      username: string;
    };

export type NotificationPresentation = {
  profileHref?: string;
  title?: string;
  subtitle?: string;
  initials?: string;
  statusLabel?: string;
  statusTone?: "primary" | "success" | "danger";
  action?: NotificationAction;
};

export type Builder = (
  notification: NotificationListItem
) => NotificationPresentation | null;
