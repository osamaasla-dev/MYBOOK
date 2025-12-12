import type { Prisma } from "@prisma/client";

import type { PostReactionType } from "../constants/reactions";
import type { ReactionOperation, ReactionSummary } from "../utils/reaction";

export type CreatePostResponseData = Prisma.PostGetPayload<{
  include: {
    media: true;
  };
}>;

export type RecordPostViewResponse = {
  queued?: boolean;
  deduplicated?: boolean;
};

export type PostReactionResponse = {
  reaction: PostReactionType | null;
  reactionsCount: number;
  reactionSummary: ReactionSummary;
  operation: ReactionOperation;
};
