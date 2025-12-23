import type { Prisma } from "@prisma/client";

import { logger } from "@/lib/logger";
import { getBlockedUserIds } from "@/features/services/server/blockedUsers";
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

export async function applyCommentBlockedUsersFilter(
  where: CommentReactionWhereInput,
  viewerId?: string | null,
  logContext?: { requestId?: string; route?: string }
) {
  if (!viewerId) {
    return where;
  }

  const log = logger.child({
    requestId: logContext?.requestId ?? "comment-reactions:unknown",
    route: logContext?.route ?? "features:postDetails:commentReactions",
  });

  const blockedIds = await getBlockedUserIds(viewerId);
  if (!blockedIds.size) {
    log.debug(
      { viewerId },
      "No blocked users for viewer when fetching comments"
    );
    return where;
  }

  log.debug(
    { viewerId, blockedCount: blockedIds.size },
    "Applying blocked user filter for comment reactions query"
  );

  return {
    ...where,
    userId: {
      notIn: Array.from(blockedIds),
    },
  };
}
