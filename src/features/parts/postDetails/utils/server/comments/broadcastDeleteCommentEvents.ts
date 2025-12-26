import { ReactionSummary } from "@/features/parts/post/utils/reaction";
import {
  broadcastPostDetailCommentDeletedEvent,
  broadcastPostDetailMetaEvent,
  broadcastPostMetaEvent,
} from "@/features/parts/post/utils/realtime";
import { Logger } from "pino";

type BroadcastDeleteCommentEventsInput = {
  postId: string;
  postAuthorId: string;
  commentId: string;
  parentId?: string | null;
  commentsCount: number;
  sharesCount: number;
  reactionSummary: ReactionSummary | null;
  initiatorId: string;
  log: Logger;
};

export async function broadcastDeleteCommentEvents({
  postId,
  postAuthorId,
  commentId,
  parentId = null,
  commentsCount,
  sharesCount,
  reactionSummary,
  initiatorId,
  log,
}: BroadcastDeleteCommentEventsInput) {
  const tasks = [
    {
      phase: "details:comment:deleted",
      promise: broadcastPostDetailCommentDeletedEvent({
        postId,
        initiatorId,
        commentId,
        parentId,
      }),
    },
    {
      phase: "details:meta",
      promise: broadcastPostDetailMetaEvent({
        postId,
        initiatorId,
        commentsCount,
        sharesCount,
        reactionSummary,
      }),
    },
    {
      phase: "owner:meta",
      promise: broadcastPostMetaEvent({
        postAuthorId,
        initiatorId,
        postId,
        commentsCount,
        sharesCount,
        reactionSummary,
      }),
    },
  ];

  const results = await Promise.allSettled(tasks.map((task) => task.promise));

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      log.error(
        { error: result.reason, phase: tasks[index]?.phase },
        "Failed to broadcast delete comment event"
      );
    }
  });
}
