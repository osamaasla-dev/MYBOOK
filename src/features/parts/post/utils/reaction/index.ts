import { ReactionState } from "@prisma/client";
import { postReactionSchema } from "../../schemas/reactionSchema";

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

export function parseReactionPayload(json: unknown) {
  return postReactionSchema.safeParse(json);
}
