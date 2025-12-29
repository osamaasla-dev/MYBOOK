"use server";

import { NotificationType } from "@prisma/client";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type CreatePostCommentNotificationInput = {
  actorId: string;
  actorName?: string | null;
  actorUsername?: string | null;
  postAuthorId: string;
  postId: string;
  commentId: string;
  parentId: string | null;
  contentPreview: string;
  requestId: string;
  route: string;
};

export async function createPostCommentNotification(
  input: CreatePostCommentNotificationInput
) {
  const {
    actorId,
    actorName,
    actorUsername,
    postAuthorId,
    postId,
    commentId,
    parentId,
    contentPreview,
    requestId,
    route,
  } = input;

  const log = logger.child({
    module: "commentNotifications",
    action: "create",
    requestId,
    route,
    actorId,
    postAuthorId,
    postId,
    commentId,
  });

  if (!actorId || !postAuthorId || !postId || !commentId) {
    log.warn("createPostCommentNotification called with missing params");
    return null;
  }

  if (actorId === postAuthorId) {
    log.debug("Skipping notification because actor is post author");
    return null;
  }

  try {
    const kind = parentId ? "reply_comment" : "post_comment";
    const type = parentId ? NotificationType.REPLY : NotificationType.COMMENT;

    const metadata = {
      kind,
      actorName: actorName ?? null,
      actorUsername: actorUsername ?? null,
      contentPreview,
      status: "active",
    };

    const notification = await prisma.notification.create({
      data: {
        userId: postAuthorId,
        actorId,
        type,
        postId,
        commentId,
        metadata,
      },
      select: { id: true },
    });

    log.debug(
      { notificationId: notification.id },
      "Created post comment notification"
    );
    return notification.id;
  } catch (error) {
    log.error({ error }, "Failed to create post comment notification");
    return null;
  }
}
