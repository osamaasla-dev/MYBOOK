import { NotificationType } from "@prisma/client";

import type { NotificationListItem } from "../types";
import type { Builder, NotificationPresentation } from "./presentation/types";
import {
  postPresentationBuilder,
  followPresentationBuilder,
  friendPresentationBuilder,
  reactionPresentationBuilder,
} from "./presentation/index";

const builders: Partial<Record<NotificationType, Builder>> = {
  [NotificationType.FOLLOW]: followPresentationBuilder,
  [NotificationType.FRIEND]: friendPresentationBuilder,
  [NotificationType.POST]: postPresentationBuilder,
  [NotificationType.REACTION]: reactionPresentationBuilder,
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
