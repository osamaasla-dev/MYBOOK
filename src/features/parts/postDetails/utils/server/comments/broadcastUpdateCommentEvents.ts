"use server";

import type { Logger } from "pino";

import { broadcastPostDetailCommentUpdatedEvent } from "@/features/parts/post/utils/realtime";

type BroadcastUpdateCommentEventsInput = {
  comment: {
    id: string;
    authorId: string;
    postId: string;
    parentId: string | null;
    content: string;
    updatedAt: Date;
    isEdited: boolean;
  };
  log: Logger;
};

export async function broadcastUpdateCommentEvents({
  comment,
  log,
}: BroadcastUpdateCommentEventsInput) {
  const payload = {
    postId: comment.postId,
    authorId: comment.authorId,
    commentId: comment.id,
    parentId: comment.parentId ?? null,
    content: comment.content,
    updatedAt: comment.updatedAt?.toISOString
      ? comment.updatedAt.toISOString()
      : new Date().toISOString(),
    isEdited: Boolean(comment.isEdited),
  };

  try {
    await broadcastPostDetailCommentUpdatedEvent(payload);
  } catch (error) {
    log.error({ error }, "Failed to broadcast comment update events");
  }
}
