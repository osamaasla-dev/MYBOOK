import { redis } from "@/lib/redis";
import { ReactionState } from "@prisma/client";
import { postReactionSchema } from "../../schemas/reactionSchema";
import {
  POST_REACTION_MAX_ACTIONS,
  POST_REACTION_RATE_NAMESPACE,
  POST_REACTION_WINDOW_MS,
} from "../../constants";

export type ReactionSummary = Record<string, number>;

type ReactionAggregate = {
  emoji: string;
  count: number;
};

export type ReactionOperation = ReactionState | "NOOP";

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

type ReactionTargetRateLimitOptions = {
  userId: string;
  targetId: string;
  namespace?: string;
  windowMs?: number;
  maxActions?: number;
};

export async function isReactionRateLimitedForTarget({
  userId,
  targetId,
  namespace = POST_REACTION_RATE_NAMESPACE,
  windowMs = POST_REACTION_WINDOW_MS,
  maxActions = POST_REACTION_MAX_ACTIONS,
}: ReactionTargetRateLimitOptions): Promise<boolean> {
  const key = `${namespace}:${targetId}:${userId}`;
  const ttlSeconds = Math.ceil(windowMs / 1000);

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }

  return count > maxActions;
}

export async function isReactionRateLimited({
  userId,
  postId,
  windowMs = POST_REACTION_WINDOW_MS,
  maxActions = POST_REACTION_MAX_ACTIONS,
}: RateLimitOptions): Promise<boolean> {
  return isReactionRateLimitedForTarget({
    userId,
    targetId: postId,
    namespace: POST_REACTION_RATE_NAMESPACE,
    windowMs,
    maxActions,
  });
}

export function parseReactionPayload(json: unknown) {
  return postReactionSchema.safeParse(json);
}
