import { NotificationType, Prisma } from "@prisma/client";
import { FollowNotificationPayload, PrismaTransaction } from "../../types";
import { isFollowNotificationBlocked } from "../../utils";
import { buildFollowNotificationMetadata } from "./NotificationMetadata";

export async function createFollowNotification(
  tx: PrismaTransaction,
  payload: FollowNotificationPayload & { followId?: string | null }
): Promise<string | null> {
  const blocked = await isFollowNotificationBlocked(
    tx,
    payload.followerId,
    payload.targetUserId
  );

  if (blocked) {
    return null;
  }

  const metadata = await buildFollowNotificationMetadata(tx, payload);

  const created = await tx.notification.create({
    data: {
      userId: payload.targetUserId,
      actorId: payload.followerId,
      type: NotificationType.FOLLOW,
      followId: payload.followId,
      metadata,
    },
    select: { id: true },
  });

  return created.id;
}

export async function updateFollowNotification(
  tx: PrismaTransaction,
  notificationId: string,
  payload: FollowNotificationPayload & { followId?: string | null }
) {
  const metadata = await buildFollowNotificationMetadata(tx, payload);

  try {
    await tx.notification.update({
      where: { id: notificationId },
      data: {
        ...(payload.followId !== undefined && { followId: payload.followId }),
        metadata,
      },
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

export async function deleteFollowNotification(
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
