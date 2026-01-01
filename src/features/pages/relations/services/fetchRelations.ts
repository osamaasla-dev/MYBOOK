import type {
  FetchRelationsInput,
  RelationsListResult,
  RelationTab,
} from "../types";
import { type BaseTabQueryArgs, type TabRecord } from "./shared";
import {
  fetchFollowers,
  fetchFollowing,
  fetchFollowRequests,
  fetchSentFollowRequests,
  fetchFriends,
  fetchFriendRequests,
  fetchSentFriendRequests,
  fetchBlocked,
} from "./fetchers";
import { clampLimit } from "../schema";

type TabFetcher = (args: BaseTabQueryArgs) => Promise<TabRecord[]>;

const tabFetchers: Record<RelationTab, TabFetcher> = {
  followers: fetchFollowers,
  following: fetchFollowing,
  "follow-requests": fetchFollowRequests,
  "sent-follow-requests": fetchSentFollowRequests,
  friends: fetchFriends,
  "friend-requests": fetchFriendRequests,
  "sent-friend-requests": fetchSentFriendRequests,
  blocked: fetchBlocked,
};

export async function fetchRelationsList({
  userId,
  tab,
  limit,
  cursor,
}: FetchRelationsInput): Promise<RelationsListResult> {
  const take = clampLimit(limit);
  const fetcher = tabFetchers[tab];
  const records = await fetcher({ userId, take, cursor });

  const items = [...records];
  let nextCursor: string | null = null;

  if (items.length > take) {
    const nextItem = items.pop();
    nextCursor = nextItem?.id ?? null;
  }

  return {
    items,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
  };
}
