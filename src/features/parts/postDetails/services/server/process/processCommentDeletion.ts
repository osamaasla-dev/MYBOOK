import { logger } from "@/lib/logger";
import { applyNegativeSignal } from "@/features/parts/interaction/services/negativeSignal";
import { broadcastDeleteCommentEvents } from "@/features/parts/postDetails/utils/server/comments";
import { deleteComment } from "../comment";
import { validatePostAccess } from "../access";

export async function processCommentDeletion({
  commentId,
  postId,
  parentId,
  postAuthorId,
  deletedById,
  commentAuthorId,
  requestId,
  route,
}: {
  commentId: string;
  postId: string;
  parentId: string | null;
  postAuthorId: string;
  deletedById: string;
  commentAuthorId: string | null;
  requestId: string;
  route: string;
}) {
  const log = logger.child({ requestId, route });

  // Validate post access before processing
  const accessResult = await validatePostAccess({
    postId,
    viewerId: deletedById,
  });
  if (!accessResult) {
    log.warn(
      { postId, deletedById },
      "User not permitted to access post for comment deletion"
    );
    throw new Error("Access denied: Cannot delete comment on this post");
  }

  // Delete the comment
  const result = await deleteComment({
    commentId,
    postId,
    parentId,
    postAuthorId,
    deletedById,
  });

  // Apply negative signal if deleting someone else's comment
  if (commentAuthorId && commentAuthorId !== deletedById) {
    void applyNegativeSignal({
      actorId: deletedById,
      targetUserId: commentAuthorId,
      type: "deleteComment",
    }).catch((error) => {
      log.warn(
        {
          err: error,
          actorId: deletedById,
          targetUserId: commentAuthorId,
        },
        "Failed to record delete comment negative signal"
      );
    });
  }

  // Broadcast deletion events
  void broadcastDeleteCommentEvents({
    postId,
    postAuthorId,
    commentId: result.id,
    parentId: parentId ?? null,
    commentsCount: result.commentsCount,
    sharesCount: result.sharesCount,
    reactionSummary: result.reactionSummary,
    initiatorId: deletedById,
    log,
  });

  log.info({ commentId: result.id, postId }, "Comment deleted successfully");

  return result;
}
