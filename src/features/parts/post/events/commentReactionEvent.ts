import type { PostReactionType } from "../constants/reactions";
import { ReactionOperation } from "../utils/reaction";
export const POST_COMMENT_REACTION_EVENT = "post:comment:reaction" as const;

export type CommentReactionEventPayload = {
  postId: string;
  commentId: string;
  reaction: PostReactionType;
  parentId: string | null;
  reactorId: string;
  reactorName: string;
  operation: ReactionOperation;
};
