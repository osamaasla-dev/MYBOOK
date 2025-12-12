import { redis } from "@/lib/redis";

import { postReactionSchema } from "../../schemas/reactionSchema";

export type ReactionSummary = Record<string, number>;

type ReactionAggregate = {
  emoji: string;
  count: number;
};

export type ReactionOperation = "added" | "updated" | "removed";

export function buildReactionSummary(aggregates: ReactionAggregate[]): {
  reactionsCount: number;
  reactionSummary: ReactionSummary;
} {
  const reactionSummary = aggregates.reduce<ReactionSummary>((acc, item) => {
    acc[item.emoji] = item.count;
    return acc;
  }, {});

  const reactionsCount = aggregates.reduce((sum, item) => sum + item.count, 0);

  return { reactionsCount, reactionSummary };
}

export function buildReactionResponsePayload(result: {
  reaction: string | null;
  reactionsCount: number;
  reactionSummary: ReactionSummary;
  operation: ReactionOperation;
}) {
  return {
    reaction: result.reaction,
    reactionsCount: result.reactionsCount,
    reactionSummary: result.reactionSummary,
    operation: result.operation,
  };
}

type RateLimitOptions = {
  userId: string;
  postId: string;
  windowMs?: number;
  maxActions?: number;
};

export async function isReactionRateLimited({
  userId,
  postId,
  windowMs = 10_000,
  maxActions = 10,
}: RateLimitOptions): Promise<boolean> {
  const key = `post:reaction:rate:${postId}:${userId}`;
  const ttlSeconds = Math.ceil(windowMs / 1000);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }

  return count > maxActions;
}

export function parseReactionPayload(json: unknown) {
  return postReactionSchema.safeParse(json);
}
