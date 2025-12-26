import { ReactionSummary } from "../utils/reaction";

export const POST_META_EVENT = "post:meta" as const;

export type BroadcastPostMetaInput = {
  postId: string;
  initiatorId: string;
  commentsCount?: number;
  reactionsCount?: number;
  sharesCount?: number;
  latestActivityAt?: string;
  reactionSummary?: ReactionSummary | null;
};
