import { z } from "zod";

import {
  DEFAULT_POST_REACTIONS_LIMIT,
  MAX_POST_REACTIONS_LIMIT,
  postReactionsQuerySchema,
  type ReactionTab,
} from "@/features/parts/post/services/server/reactions/schema";

export type CommentReactionTab = ReactionTab;

export const DEFAULT_COMMENT_REACTIONS_LIMIT = DEFAULT_POST_REACTIONS_LIMIT;
export const MAX_COMMENT_REACTIONS_LIMIT = MAX_POST_REACTIONS_LIMIT;

export const commentReactionsQuerySchema = z.object({
  tab: postReactionsQuerySchema.shape.tab,
  limit: postReactionsQuerySchema.shape.limit,
  cursor: postReactionsQuerySchema.shape.cursor,
});
