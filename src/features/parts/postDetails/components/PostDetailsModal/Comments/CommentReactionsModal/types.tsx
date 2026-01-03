import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { CommentReactionTab } from "@/features/parts/postDetails/services/server/comment/reactions/schema";

export type ReactionOptionCount = {
  id: CommentReactionTab;
  label: string;
  emoji: string;
  count: number;
};

export type ReactionSummaryMeta = {
  summary: ReactionSummary | null;
  tab: CommentReactionTab;
};
