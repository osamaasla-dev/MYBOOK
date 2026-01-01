import type { Prisma } from "@prisma/client";

import type { CommentReactionTab } from "./schema";

export type CommentReactionWhereInput = Prisma.CommentReactionWhereInput;

export function buildCommentReactionFilter(
  tab: CommentReactionTab
): CommentReactionWhereInput {
  if (tab === "all") {
    return {};
  }

  return { emoji: tab };
}
