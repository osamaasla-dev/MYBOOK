import type { Prisma } from "@prisma/client";

import type { PostReactionType } from "../../../constants/reactions";
import type { ReactionTab } from "./schema";
import type {
  ReactionOperation,
  ReactionSummary,
} from "../../../utils/reaction";

export type ReactionUserSummary = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type PostReactionListItem = {
  id: string;
  reaction: PostReactionType;
  emoji: string;
  createdAt: string;
  user: ReactionUserSummary;
};

export type PostReactionsListResult = {
  items: PostReactionListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
};

export type FetchPostReactionsInput = {
  postId: string;
  tab: ReactionTab;
  limit: number;
  cursor?: string;
  viewerId?: string | null;
  requestId?: string;
  route?: string;
};

export type PostReactionsResponse = {
  items: PostReactionListItem[];
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
