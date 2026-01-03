import type { Prisma } from "@prisma/client";

import type {
  FetchNotificationsInput,
  NotificationListItem,
  NotificationListResult,
} from "../../types";
import { MAX_NOTIFICATIONS_LIMIT } from "../../schema";
import { prisma } from "@/lib/prisma";
import { groupNotificationItems } from "./groupNotificationItems";

export async function fetchUserNotifications({
  userId,
  limit,
  cursor,
  tab = "all",
}: FetchNotificationsInput): Promise<NotificationListResult> {
  const take = Math.min(Math.max(limit, 1), MAX_NOTIFICATIONS_LIMIT);

  const tabFilter: Prisma.NotificationWhereInput =
    tab === "read"
      ? { isRead: true }
      : tab === "unread"
      ? { isRead: false }
      : {};

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...tabFilter,
    NOT: {
      metadata: {
        path: "status",
        equals: "canceled",
      },
    },
    ...(userId
      ? {
          actor: {
            blockedBy: {
              none: {
                blockerId: userId,
              },
            },
            blocks: {
              none: {
                blockedId: userId,
              },
            },
          },
        }
      : {}),
  };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    select: {
      id: true,
      type: true,
      metadata: true,
      isRead: true,
      createdAt: true,
      followId: true,
      postId: true,
      commentId: true,
      actor: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          name: true,
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (notifications.length > take) {
    const nextItem = notifications.pop();
    nextCursor = nextItem?.id ?? null;
  }

  const items: NotificationListItem[] = notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    metadata: notification.metadata,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor
      ? {
          id: notification.actor.id,
          username: notification.actor.username,
          avatarUrl: notification.actor.avatarUrl,
          name: notification.actor.name,
        }
      : null,
    related: {
      followId: notification.followId,
      postId: notification.postId,
      commentId: notification.commentId,
    },
  }));

  const groupedItems = groupNotificationItems(items);

  return {
    items: groupedItems,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
  };
}
