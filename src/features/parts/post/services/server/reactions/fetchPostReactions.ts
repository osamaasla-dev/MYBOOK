import { PostReactionType } from "../../../constants/reactions";
import type { ReactionSummary } from "../../../utils/reaction";
import { logger } from "@/lib/logger";
import { MAX_POST_REACTIONS_LIMIT } from "./schema";
import {
  type FetchPostReactionsInput,
  type PostReactionsResponse,
} from "./types";
import {
  applyBlockedUsersFilter,
  buildReactionFilter,
  type PostReactionWhereInput,
} from "./filters";
import {
  queryPostReactionList,
  queryPostReactionSummary,
  queryViewerReaction,
} from "./queries";
import { mapReactionRecordToItem } from "./serializers";

export async function fetchPostReactions({
  postId,
  tab,
  limit,
  cursor,
  viewerId,
  requestId,
  route,
}: FetchPostReactionsInput): Promise<PostReactionsResponse> {
  const take = Math.min(Math.max(limit, 1), MAX_POST_REACTIONS_LIMIT);
  const log = logger.child({
    requestId: requestId ?? "post-reactions:unknown",
    route: route ?? "features:post:reactions",
  });

  log.info(
    { postId, tab, limit: take, cursor, viewerId },
    "fetchPostReactions started"
  );

  let where: PostReactionWhereInput = {
    postId,
    ...buildReactionFilter(tab),
  };
  where = await applyBlockedUsersFilter(where, viewerId);

  const [reactions, viewerReactionRecord, postSummary] = await Promise.all([
    queryPostReactionList({ where, cursor, takePlusOne: take + 1 }),
    queryViewerReaction(postId, viewerId),
    queryPostReactionSummary(postId),
  ]);

  let nextCursor: string | null = null;
  if (reactions.length > take) {
    const nextItem = reactions.pop();
    nextCursor = nextItem?.id ?? null;
  }

  const items = reactions.map(mapReactionRecordToItem);

  log.info(
    {
      postId,
      tab,
      count: items.length,
      hasNextPage: Boolean(nextCursor),
      viewerId,
    },
    "fetchPostReactions completed"
  );

  return {
    items,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
    reactionSummary:
      (postSummary?.reactionSummary as ReactionSummary | null) ?? null,
    viewerReaction: (viewerReactionRecord?.emoji as PostReactionType) ?? null,
  };
}
