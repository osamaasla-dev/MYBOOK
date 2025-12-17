import { NotificationType } from "@prisma/client";

import type {
  NotificationGroupingSummary,
  NotificationListItem,
} from "../../types";

const GROUPABLE_NOTIFICATION_TYPES = new Set<NotificationType>([
  NotificationType.REACTION,
  NotificationType.COMMENT,
  NotificationType.SHARE,
]);

function getGroupingKey(notification: NotificationListItem) {
  if (!GROUPABLE_NOTIFICATION_TYPES.has(notification.type)) {
    return null;
  }
  const postId = notification.related.postId;
  if (!postId) {
    return null;
  }
  return `${notification.type}:${postId}`;
}

function buildGroupingSummary(
  uniqueActorIds: Set<string>
): NotificationGroupingSummary | undefined {
  const totalActors = uniqueActorIds.size;
  if (totalActors <= 1) {
    return undefined;
  }

  return {
    totalActors,
    othersCount: totalActors - 1,
  };
}

export function groupNotificationItems(
  items: NotificationListItem[]
): NotificationListItem[] {
  const grouped: NotificationListItem[] = [];
  const groupingState = new Map<
    string,
    {
      index: number;
      uniqueActorIds: Set<string>;
    }
  >();

  items.forEach((item) => {
    const key = getGroupingKey(item);
    if (!key) {
      grouped.push(item);
      return;
    }

    const actorId = item.actor?.id;
    const existing = groupingState.get(key);

    if (!existing) {
      grouped.push(item);
      groupingState.set(key, {
        index: grouped.length - 1,
        uniqueActorIds: actorId ? new Set([actorId]) : new Set(),
      });
      return;
    }

    if (actorId) {
      existing.uniqueActorIds.add(actorId);
    }

    const targetIndex = existing.index;
    const targetItem = grouped[targetIndex];
    grouped[targetIndex] = {
      ...targetItem,
      grouping: buildGroupingSummary(existing.uniqueActorIds),
    };
  });

  return grouped;
}
