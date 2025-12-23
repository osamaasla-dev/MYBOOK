import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  reactionUserSelect,
  type ReactionUserSummary,
} from "@/features/parts/postDetails/services/server/comment/reactions/types";

export type CommentReactionRecord = {
  id: string;
  emoji: string;
  createdAt: Date;
  user: ReactionUserSummary;
};

type ListQueryParams = {
  where: Prisma.CommentReactionWhereInput;
  cursor?: string;
  takePlusOne: number;
};

export async function queryCommentReactionList({
  where,
  cursor,
  takePlusOne,
}: ListQueryParams): Promise<CommentReactionRecord[]> {
  const log = logger.child({
    route: "features:postDetails:commentReactions:list",
  });

  log.debug(
    { cursor, take: takePlusOne - 1 },
    "Executing comment reactions list query"
  );

  return prisma.commentReaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: takePlusOne,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      emoji: true,
      createdAt: true,
      user: {
        select: reactionUserSelect,
      },
    },
  }) as Promise<CommentReactionRecord[]>;
}

export async function queryCommentViewerReaction(
  commentId: string,
  viewerId?: string | null
) {
  if (!viewerId) return null;

  const log = logger.child({
    route: "features:postDetails:commentReactions:viewer",
  });

  log.debug({ commentId, viewerId }, "Querying viewer comment reaction");

  return prisma.commentReaction.findFirst({
    where: { commentId, userId: viewerId },
    select: { emoji: true },
  });
}

export async function queryCommentReactionSummary(commentId: string) {
  const log = logger.child({
    route: "features:postDetails:commentReactions:summary",
  });

  log.debug({ commentId }, "Fetching comment reaction summary");

  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { reactionSummary: true },
  });
}
