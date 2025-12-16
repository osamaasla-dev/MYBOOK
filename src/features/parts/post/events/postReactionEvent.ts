import type { PostReactionType } from "../constants/reactions";
import type { ReactionSummary, ReactionOperation } from "../utils/reaction";

export const POST_REACTION_EVENT = "post:reaction" as const;

export type PostReactionEventPayload = {
  postId: string;
  reaction: PostReactionType;
  reactorId: string;
  reactorName: string;
  operation: ReactionOperation;
  reactionSummary?: ReactionSummary | null;
  reactionsCount?: number;
};
