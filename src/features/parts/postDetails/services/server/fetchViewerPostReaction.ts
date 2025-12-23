import { prisma } from "@/lib/prisma";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import { postDetailsLogger } from "../../utils/logger";
import { ReactionState } from "@prisma/client";

type FetchViewerPostReactionInput = {
  postId: string;
  viewerId: string | null;
};

export async function fetchViewerPostReaction({
  postId,
  viewerId,
}: FetchViewerPostReactionInput): Promise<PostReactionType | null> {
  if (!viewerId) {
    return null;
  }

  const log = postDetailsLogger.child({
    func: "fetchViewerPostReaction",
    postId,
    viewerId,
  });

  const reactionRecord = await prisma.postReaction.findFirst({
    where: { postId, userId: viewerId, state: { not: ReactionState.CANCEL } },
    select: { emoji: true },
  });

  const reaction =
    (reactionRecord?.emoji as PostReactionType | undefined) ?? null;

  log.debug({ hasReaction: Boolean(reaction) }, "Fetched viewer reaction");

  return reaction;
}
