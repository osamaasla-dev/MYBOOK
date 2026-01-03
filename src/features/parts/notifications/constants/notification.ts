export const NOTIFICATION_PAGE_SIZE = 10;

export const NOTIFICATION_TAB_VALUES = ["all", "read", "unread"] as const;

export type NotificationTab = (typeof NOTIFICATION_TAB_VALUES)[number];

export const NOTIFICATION_EVENTS = [
  "follow:added",
  "follow:removed",
  "follow:requested",
  "follow:approved",
  "follow:rejected",
  "follow:canceled",
  "friend:request",
  "friend:canceled",
  "friend:accepted",
  "friend:rejected",
  "post:created",
  "post:reaction",
  "post:comment:create",
  "post:comment:reaction",
] as const;
