import { NotificationType, Prisma } from "@prisma/client";

import {
  type FollowNotificationPayload,
  type PrismaTransaction,
} from "../types";
import {
  buildFollowNotificationMetadata,
  isFollowNotificationBlocked,
} from "../utils";

export async function deleteFollowNotification(
  tx: PrismaTransaction,
  followerId: string,
  targetUserId: string
) {
  await tx.notification.deleteMany({
    where: {
      userId: targetUserId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
    },
  });
}

export async function upsertFollowNotification(
  tx: PrismaTransaction,
  payload: FollowNotificationPayload & { followId: string }
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

  const uniqueWhere: Prisma.NotificationWhereUniqueInput = {
    userId_actorId_type: {
      userId: payload.targetUserId,
      actorId: payload.followerId,
      type: NotificationType.FOLLOW,
    },
  };

  const existing = await tx.notification.findUnique({
    where: uniqueWhere,
    select: { id: true },
  });

  if (existing) {
    const updated = await tx.notification.update({
      where: uniqueWhere,
      data: {
        followId: payload.followId,
        metadata,
      },
      select: { id: true },
    });

    return updated.id;
  }

  try {
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const updated = await tx.notification.update({
        where: uniqueWhere,
        data: {
          followId: payload.followId,
          metadata,
        },
        select: { id: true },
      });

      return updated.id;
    }

    throw error;
  }
}
