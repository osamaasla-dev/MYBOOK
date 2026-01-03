import { logger } from "@/lib/logger";
import { PostReactionType } from "@/features/parts/post/constants/reactions";
import {
  persistCommentReaction,
  createCommentReactionNotification,
} from "../comment";
import {
  broadcastCommentMetaEvent,
  broadcastCommentReactionEvent,
} from "@/features/parts/post/utils/realtime";
import { validatePostAccess } from "../access";

export async function processCommentReactionCreation({
  commentId,
  postId,
  userId,
  reaction,
  userName,
  name,
  requestId,
  route,
}: {
  commentId: string;
  postId: string;
  userId: string;
  reaction: PostReactionType;
  userName: string | null;
  name: string | null;
  requestId: string;
  route: string;
}) {
  const log = logger.child({ requestId, route });

  // Validate post access before processing
  const accessResult = await validatePostAccess({ postId, viewerId: userId });
  if (!accessResult) {
    log.warn(
      { postId, userId },
      "User not permitted to access post for comment reaction"
    );
    throw new Error("Access denied: Cannot react to comment on this post");
  }

  // Create the reaction
  const result = await persistCommentReaction({
    commentId,
    postId,
    userId,
    reaction,
  });

  // Broadcast reaction event
  const viewerName = userName ?? "Someone";
  void broadcastCommentReactionEvent({
    postId,
    commentId,
    commentAuthorId: result.commentAuthorId,
    reaction: (result.reaction ?? reaction)!,
    parentId: result.parentId,
    viewerId: userId,
    viewerName,
    reactorName: viewerName,
    operation: result.operation,
  });

  // Create notification
  void createCommentReactionNotification({
    actorId: userId,
    actorName: userName,
    actorUsername: name,
    commentAuthorId: result.commentAuthorId,
    postId,
    commentId,
    parentId: result.parentId,
    reaction: (result.reaction ?? reaction)!,
    requestId,
    route,
  }).catch((error: unknown) => {
    log.error({ error }, "Failed to create comment reaction notification");
  });

  // Broadcast comment metadata update
  void broadcastCommentMetaEvent({
    postId,
    initiatorId: userId,
    parentId: result.parentId,
    commentId,
    reactionsCount: result.reactionsCount,
    reactionSummary: result.reactionSummary,
  });

  log.info(
    {
      commentId,
      userId,
      reaction: result.reaction,
      operation: result.operation,
    },
    "Comment reaction created successfully"
  );

  return result;
}
