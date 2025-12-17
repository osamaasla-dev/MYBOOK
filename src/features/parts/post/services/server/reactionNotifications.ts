"use server";

import { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { PrismaTransaction } from "@/features/parts/notifications/types";
import type { PostReactionType } from "../../constants/reactions";

type Client = PrismaTransaction | typeof prisma;

type ReactionNotificationMetadata = {
  kind: "post_reaction";
  status: "active" | "canceled";
  reaction?: PostReactionType | null;
  reactorName?: string | null;
  reactorUsername?: string | null;
  canceledAt?: string | null;
  reactivatedAt?: string | null;
};

export type UpsertReactionNotificationInput = {
  postId: string;
  postAuthorId: string;
  reactorId: string;
  reaction: PostReactionType | null;
  reactorName?: string | null;
  reactorUsername?: string | null;
  tx?: PrismaTransaction;
};

export type CancelReactionNotificationInput = {
  postId: string;
  postAuthorId: string;
  reactorId: string;
  tx?: PrismaTransaction;
};

const NOTIFICATION_TYPE = NotificationType.REACTION;

function getClient(tx?: PrismaTransaction): Client {
  return tx ?? prisma;
}

function toJsonObject(value: Prisma.JsonValue | null): Prisma.JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.JsonObject;
  }
  return {};
}

function buildMetadata(
  overrides: Partial<ReactionNotificationMetadata>
): Prisma.JsonObject {
  const entries: ReactionNotificationMetadata = {
    kind: "post_reaction",
    status: overrides.status ?? "active",
    reaction: overrides.reaction ?? null,
    reactorName: overrides.reactorName ?? null,
    reactorUsername: overrides.reactorUsername ?? null,
    canceledAt: overrides.canceledAt ?? null,
    reactivatedAt: overrides.reactivatedAt ?? null,
  };

  return entries as Prisma.JsonObject;
}

export async function upsertPostReactionNotification({
  postId,
  postAuthorId,
  reactorId,
  reaction,
  reactorName,
  reactorUsername,
  tx,
}: UpsertReactionNotificationInput) {
  const log = logger.child({
    module: "reactionNotifications",
    action: "upsert",
    postId,
    postAuthorId,
    reactorId,
  });

  if (!postId || !postAuthorId || !reactorId || reactorId === postAuthorId) {
    log.warn("Skipping upsertPostReactionNotification due to invalid inputs");
    return null;
  }

  try {
    const client = getClient(tx);
    const metadata = buildMetadata({
      status: "active",
      reaction,
      reactorName,
      reactorUsername,
      reactivatedAt: new Date().toISOString(),
      canceledAt: null,
    });

    const existing = await client.notification.findFirst({
      where: {
        userId: postAuthorId,
        actorId: reactorId,
        postId,
        type: NOTIFICATION_TYPE,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, metadata: true },
    });

    if (existing) {
      const previousMeta = toJsonObject(existing.metadata);
      const nextMeta = {
        ...previousMeta,
        ...metadata,
      };

      await client.notification.update({
        where: { id: existing.id },
        data: {
          metadata: nextMeta as Prisma.JsonObject,
          isRead: false,
          createdAt: new Date(),
        },
      });

      log.debug(
        { notificationId: existing.id },
        "Updated post reaction notification"
      );
      return existing.id;
    }

    const created = await client.notification.create({
      data: {
        userId: postAuthorId,
        actorId: reactorId,
        postId,
        type: NOTIFICATION_TYPE,
        metadata,
      },
      select: { id: true },
    });

    log.debug(
      { notificationId: created.id },
      "Created post reaction notification"
    );
    return created.id;
  } catch (error) {
    log.error({ error }, "Failed to upsert post reaction notification");
    throw error;
  }
}

export async function cancelPostReactionNotification({
  postId,
  postAuthorId,
  reactorId,
  tx,
}: CancelReactionNotificationInput) {
  const log = logger.child({
    module: "reactionNotifications",
    action: "cancel",
    postId,
    postAuthorId,
    reactorId,
  });

  if (!postId || !postAuthorId || !reactorId || postAuthorId === reactorId) {
    log.warn("Skipping cancelPostReactionNotification due to invalid inputs");
    return null;
  }

  try {
    const client = getClient(tx);
    const existing = await client.notification.findFirst({
      where: {
        userId: postAuthorId,
        actorId: reactorId,
        postId,
        type: NOTIFICATION_TYPE,
        metadata: {
          path: "status",
          not: "canceled",
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, metadata: true },
    });

    if (!existing) {
      log.debug("No active reaction notification found to cancel");
      return null;
    }

    const meta = toJsonObject(existing.metadata);
    const nextMeta: ReactionNotificationMetadata = {
      ...meta,
      kind: "post_reaction",
      status: "canceled",
      canceledAt: new Date().toISOString(),
    };

    await client.notification.update({
      where: { id: existing.id },
      data: {
        metadata: nextMeta as Prisma.JsonObject,
      },
    });

    log.debug(
      { notificationId: existing.id },
      "Canceled post reaction notification"
    );
    return existing.id;
  } catch (error) {
    log.error({ error }, "Failed to cancel post reaction notification");
    throw error;
  }
}
