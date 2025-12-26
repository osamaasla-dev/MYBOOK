import { validateCuid } from "@/schemas/ids";
import { apiResponse } from "@/lib/apiResponse";
import { commentMessages, userMessages } from "@/lib/messages";
import { Logger } from "pino";

export async function validateReplyIds({
  postId,
  commentId,
  requestId,
  log,
}: {
  postId: string;
  commentId: string;
  requestId: string;
  log: Logger;
}) {
  // Validate IDs
  const validatedPostId = validateCuid(postId);
  const validatedCommentId = validateCuid(commentId);

  if (!validatedPostId.success || !validatedCommentId.success) {
    log.warn(
      { postId, commentId },
      "Invalid postId or commentId parameter for reply creation"
    );
    return {
      error: apiResponse(false, {}, userMessages.invalidParams, 400, requestId),
    };
  }

  return {
    normalizedPostId: validatedPostId.data,
    normalizedCommentId: validatedCommentId.data,
  };
}

export async function validateParentComment({
  postId,
  commentId,
  requestId,
  log,
}: {
  postId: string;
  commentId: string;
  requestId: string;
  log: Logger;
}) {
  const prisma = (await import("@/lib/prisma")).prisma;

  // Check if parent comment exists and belongs to the post
  const parentComment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      postId,
      isDeleted: false,
    },
    select: { id: true, authorId: true },
  });

  if (!parentComment) {
    log.warn(
      { commentId, postId },
      "Parent comment not found or doesn't belong to post"
    );
    return {
      error: apiResponse(
        false,
        null,
        commentMessages.commentNotFound,
        404,
        requestId
      ),
    };
  }

  return { parentAuthorId: parentComment.authorId };
}
