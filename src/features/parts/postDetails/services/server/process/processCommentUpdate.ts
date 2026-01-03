import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { updateComment } from "../comment";
import { broadcastUpdateCommentEvents } from "@/features/parts/postDetails/utils/server/comments";
import { validatePostAccess } from "../access";

export async function processCommentUpdate({
  commentId,
  content,
  actorId,
  requestId,
  route,
}: {
  commentId: string;
  content: string;
  actorId: string;
  requestId: string;
  route: string;
}) {
  const log = logger.child({ requestId, route });

  // First get the comment to extract postId for access validation
  const commentForValidation = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true },
  });

  if (!commentForValidation) {
    throw new Error("Comment not found");
  }

  // Validate post access before processing
  const accessResult = await validatePostAccess({
    postId: commentForValidation.postId,
    viewerId: actorId,
  });
  if (!accessResult) {
    log.warn(
      { postId: commentForValidation.postId, actorId },
      "User not permitted to access post for comment update"
    );
    throw new Error("Access denied: Cannot update comment on this post");
  }

  // Update the comment
  const updatedComment = await updateComment({
    commentId,
    content,
    actorId,
  });

  log.info({ commentId: updatedComment.id }, "Comment updated successfully");

  // Broadcast update events
  void broadcastUpdateCommentEvents({
    comment: updatedComment,
    log,
  }).catch((error) => {
    log.warn(
      { err: error, commentId: updatedComment.id },
      "Failed to broadcast comment update"
    );
  });

  return updatedComment;
}
