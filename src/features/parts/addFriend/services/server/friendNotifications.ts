import { NotificationType, Prisma } from "@prisma/client";

import { buildFriendNotificationMetadata } from "./NotificationMetadata";
import { PrismaTransaction, FriendNotificationPayload } from "../../types";

export async function createFriendNotification(
  tx: PrismaTransaction,
  payload: FriendNotificationPayload
): Promise<string | null> {
  const metadata = await buildFriendNotificationMetadata(tx, payload);

  const created = await tx.notification.create({
    data: {
      userId: payload.targetUserId,
      actorId: payload.requesterId,
      type: NotificationType.FRIEND,
      metadata,
    },
    select: { id: true },
  });

  return created.id;
}

export async function updateFriendNotification(
  tx: PrismaTransaction,
  notificationId: string,
  payload: FriendNotificationPayload
) {
  const metadata = await buildFriendNotificationMetadata(tx, payload);

  try {
    await tx.notification.update({
      where: { id: notificationId },
      data: { metadata },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return null;
    }

    throw error;
  }

  return notificationId;
}

export async function deleteFriendNotification(
  tx: PrismaTransaction,
  notificationId: string
) {
  try {
    await tx.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return;
    }

    throw error;
  }
}
