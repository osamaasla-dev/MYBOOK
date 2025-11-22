import { prisma } from "@/lib/prisma";
import type {
  FetchNotificationsInput,
  NotificationListItem,
  NotificationListResult,
} from "../types";
import { MAX_NOTIFICATIONS_LIMIT } from "../schema";

export async function fetchUserNotifications({
  userId,
  limit,
  cursor,
  unreadOnly,
}: FetchNotificationsInput): Promise<NotificationListResult> {
  const take = Math.min(Math.max(limit, 1), MAX_NOTIFICATIONS_LIMIT);

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

  return {
    items,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
  };
}
