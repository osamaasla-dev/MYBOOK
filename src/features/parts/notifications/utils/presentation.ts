import { NotificationType } from "@prisma/client";

import type { NotificationListItem } from "../types";
import type { Builder, NotificationPresentation } from "./presentation/types";
import { followPresentationBuilder } from "./presentation/follow";
import { friendPresentationBuilder } from "./presentation/friend";

const builders: Partial<Record<NotificationType, Builder>> = {
  [NotificationType.FOLLOW]: followPresentationBuilder,
  [NotificationType.FRIEND]: friendPresentationBuilder,
};

export function getNotificationPresentation(
  notification: NotificationListItem
): NotificationPresentation | null {
  const builder = builders[notification.type];

  if (!builder) {
    return null;
  }

  return builder(notification);
}
