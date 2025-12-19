import type { PostReactionType } from "../../../constants/reactions";
import type {
  ReactionSummary,
  ReactionOperation,
} from "../../../utils/reaction";

export type PersistPostReactionParams = {
  postId: string;
  userId: string;
  reaction: PostReactionType;
};

export type RemovePostReactionParams = {
  postId: string;
  userId: string;
};

export type PostReactionResult = {
  reaction: PostReactionType | null;
  reactionsCount: number;
  reactionSummary: ReactionSummary;
  operation: ReactionOperation;
  commentsCount?: number;
  sharesCount?: number;
  latestActivityAt?: Date | string | null;
};
