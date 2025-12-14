import type { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { getBlockedUserIds } from "@/features/services/server/blockedUsers";

import type { ReactionTab } from "./schema";

export type PostReactionWhereInput = Prisma.PostReactionWhereInput;

export function buildReactionFilter(tab: ReactionTab): PostReactionWhereInput {
  if (tab === "all") {
    return {};
  }

  return { emoji: tab };
}

export async function applyBlockedUsersFilter(
  where: PostReactionWhereInput,
  viewerId?: string | null,
  logContext?: { requestId?: string; route?: string }
): Promise<PostReactionWhereInput> {
  if (!viewerId) {
    return where;
  }

  const log = logger.child({
    requestId: logContext?.requestId ?? "post-reactions:unknown",
    route: logContext?.route ?? "features:post:reactions",
  });

  const blockedUserIds = await getBlockedUserIds(viewerId);
  if (!blockedUserIds.size) {
    log.debug({ viewerId }, "No blocked users found for viewer");
    return where;
  }

  log.debug(
    { viewerId, blockedCount: blockedUserIds.size },
    "Applying blocked user filter for reactions query"
  );

  return {
    ...where,
    userId: {
      notIn: Array.from(blockedUserIds),
    },
  };
}
