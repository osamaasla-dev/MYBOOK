import type { PostReactionType } from "../../../constants/reactions";
import type { ReactionSummary } from "../../../utils/reaction";

export type UsePostReactionStateOptions = {
  postId: string;
  initialReaction?: PostReactionType | null;
  initialSummary?: ReactionSummary | null | undefined;
};

export type UsePostReactionStateResult = {
  currentReaction: PostReactionType | null;
  optimisticSummary?: ReactionSummary | null | undefined;
  handleReactionSelect: (reaction: PostReactionType) => void;
  handleRemove: () => void;
};
