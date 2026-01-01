import type { Prisma } from "@prisma/client";

import type { ReactionTab } from "./schema";

export type PostReactionWhereInput = Prisma.PostReactionWhereInput;

export function buildReactionFilter(tab: ReactionTab): PostReactionWhereInput {
  if (tab === "all") {
    return {};
  }

  return { emoji: tab };
}
