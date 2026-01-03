import { logger } from "@/lib/logger";
import { recordInteraction } from "@/features/parts/interaction/services";
import { broadcastCreateCommentEvents } from "@/features/parts/postDetails/utils/server/comments";
import {
  createComment,
  createPostCommentNotification,
  resolveCommentContext,
} from "../comment";
import { validatePostAccess } from "../access";

export async function processCommentCreation({
  authorId,
  postId,
  content,
  parentId,
  requestId,
  route,
}: {
  authorId: string;
  postId: string;
  content: string;
  parentId?: string | null;
  requestId: string;
  route: string;
}) {
  const log = logger.child({ requestId, route });

  // Validate post access before processing
  const accessResult = await validatePostAccess({ postId, viewerId: authorId });
  if (!accessResult) {
    log.warn(
      { postId, authorId },
      "User not permitted to access post for comment creation"
    );
    throw new Error("Access denied: Cannot comment on this post");
  }

  // Create the comment
  const comment = await createComment({
    authorId,
    postId,
    content,
    parentId: parentId ?? null,
  });

  // Resolve comment context for notifications and events
  const commentContext = await resolveCommentContext({
    postId,
    parentId: parentId ?? null,
    viewerId: authorId,
  });

  // Record interaction
  void recordInteraction({
    actorId: authorId,
    targetUserId: commentContext.post.authorId,
    type: "comment",
  }).catch((error: unknown) => {
    log.error({ error }, "Failed to record comment interaction");
  });

  // Create notification
  const commentPreview = content.slice(0, 140);
  void createPostCommentNotification({
    actorId: authorId,
    actorName: comment.author.name,
    actorUsername: comment.author.username,
    postAuthorId: commentContext.post.authorId,
    postId: comment.postId,
    commentId: comment.id,
    parentId: comment.parentId,
    contentPreview: commentPreview,
    requestId,
    route,
  }).catch((error: unknown) => {
    log.error({ error }, "Failed to create post comment notification");
  });

  // Broadcast events
  void broadcastCreateCommentEvents({
    comment,
    postAuthorId: commentContext.post.authorId,
    parentId: parentId ?? null,
    commentsCount: commentContext.post.commentsCount,
    sharesCount: commentContext.post.sharesCount,
    reactionSummary: commentContext.post.reactionSummary,
    log,
  });

  log.info(
    { commentId: comment.id, postId: comment.postId },
    "Comment created successfully"
  );

  return comment;
}
