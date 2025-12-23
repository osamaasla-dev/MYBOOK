import type { Prisma } from "@prisma/client";

import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { CommentReactionTab } from "./schema";

export type ReactionUserSummary = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type CommentReactionListItem = {
  id: string;
  reaction: PostReactionType;
  emoji: string;
  createdAt: string;
  user: ReactionUserSummary;
};

export type FetchCommentReactionsInput = {
  postId: string;
  commentId: string;
  tab: CommentReactionTab;
  limit: number;
  cursor?: string;
  viewerId?: string | null;
  requestId?: string;
  route?: string;
};

export type CommentReactionsResponse = {
  items: CommentReactionListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  reactionSummary?: ReactionSummary | null;
  viewerReaction?: PostReactionType | null;
};

export const reactionUserSelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;
