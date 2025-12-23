"use server";

import { NotificationType } from "@prisma/client";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

export type CreateCommentReactionNotificationInput = {
  actorId: string;
  actorName?: string | null;
  actorUsername?: string | null;
  commentAuthorId: string;
  postId: string;
  commentId: string;
  reaction: PostReactionType;
  requestId: string;
  route: string;
};

export async function createCommentReactionNotification(
  input: CreateCommentReactionNotificationInput
) {
  const {
    actorId,
    actorName,
    actorUsername,
    commentAuthorId,
    postId,
    commentId,
    reaction,
    requestId,
    route,
  } = input;

  const log = logger.child({
    module: "commentReactionNotifications",
    action: "create",
    requestId,
    route,
    actorId,
    commentAuthorId,
    postId,
    commentId,
  });

  if (!actorId || !commentAuthorId || !postId || !commentId || !reaction) {
    log.warn("createCommentReactionNotification missing required params");
    return null;
  }

  if (actorId === commentAuthorId) {
    log.debug("Skipping comment reaction notification for self action");
    return null;
  }

  try {
    const metadata = {
      kind: "comment_reaction" as const,
      actorName: actorName ?? null,
      actorUsername: actorUsername ?? null,
      reaction,
      status: "active",
    };

    const notification = await prisma.notification.create({
      data: {
        userId: commentAuthorId,
        actorId,
        type: NotificationType.REACTION,
        postId,
        commentId,
        metadata,
      },
      select: { id: true },
    });

    log.debug(
      { notificationId: notification.id },
      "Created comment reaction notification"
    );
    return notification.id;
  } catch (error) {
    log.error({ error }, "Failed to create comment reaction notification");
    return null;
  }
}
