import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

import { reactionUserSelect, type ReactionUserSummary } from "./types";

export type PostReactionRecord = {
  id: string;
  emoji: string;
  createdAt: Date;
  user: ReactionUserSummary;
};

type ListQueryParams = {
  where: Prisma.PostReactionWhereInput;
  cursor?: string;
  takePlusOne: number;
};

export async function queryPostReactionList({
  where,
  cursor,
  takePlusOne,
}: ListQueryParams): Promise<PostReactionRecord[]> {
  const log = logger.child({
    route: "features:post:reactions:queryList",
  });

  log.debug(
    { cursor, take: takePlusOne - 1 },
    "Executing post reactions list query"
  );

  return prisma.postReaction.findMany({
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
  }) as Promise<PostReactionRecord[]>;
}

export async function queryViewerReaction(
  postId: string,
  viewerId?: string | null
) {
  if (!viewerId) return null;

  const log = logger.child({
    route: "features:post:reactions:viewerReaction",
  });

  log.debug({ postId, viewerId }, "Querying viewer reaction");

  return prisma.postReaction.findFirst({
    where: { postId, userId: viewerId },
    select: { emoji: true },
  });
}

export async function queryPostReactionSummary(postId: string) {
  const log = logger.child({
    route: "features:post:reactions:summary",
  });

  log.debug({ postId }, "Fetching post reaction summary");

  return prisma.post.findUnique({
    where: { id: postId },
    select: { reactionSummary: true },
  });
}
