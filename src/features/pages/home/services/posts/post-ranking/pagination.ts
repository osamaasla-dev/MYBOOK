import {
  DEFAULT_FEED_PAGE_SIZE,
  type RankedFeedPage,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

import {
  readRankedPostsCache,
  writeRankedPostsCache,
} from "@/features/pages/home/utils/posts/post-ranking/cache";
import { rankPostsForImportantUsersFeed } from "./ranker";

export type FeedPageParams = {
  viewerId: string;
  importantUsers: ImportantUserScore[];
  cursor?: number;
  pageSize?: number;
  windowDays?: number;
  perUserLimit?: number;
  maxTotalPosts?: number;
  now?: Date;
};

export async function getRankedFeedPage(
  params: FeedPageParams
): Promise<RankedFeedPage> {
  const {
    viewerId,
    importantUsers,
    cursor = 0,
    pageSize = DEFAULT_FEED_PAGE_SIZE,
    windowDays,
    perUserLimit,
    maxTotalPosts,
    now,
  } = params;

  if (!viewerId) {
    return {
      posts: [],
      nextCursor: null,
      total: 0,
      storedAt: null,
      cacheHit: false,
    };
  }

  const cached = await readRankedPostsCache(viewerId);
  let rankedPosts = cached?.posts;
  let storedAt = cached?.storedAt ?? null;
  let cacheHit = Boolean(rankedPosts && rankedPosts.length);

  if (!rankedPosts || !rankedPosts.length) {
    const ranked = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers,
      windowDays,
      perUserLimit,
      maxTotalPosts,
      now,
    });

    rankedPosts = ranked.posts;
    storedAt = rankedPosts.length ? Date.now() : null;
    cacheHit = false;

    if (rankedPosts.length) {
      await writeRankedPostsCache(viewerId, rankedPosts);
    }
  }

  if (!rankedPosts.length) {
    return {
      posts: [],
      nextCursor: null,
      total: 0,
      storedAt,
      cacheHit,
    };
  }

  const start = cursor;
  const end = cursor + pageSize;
  const pagePosts = rankedPosts.slice(start, end);
  const nextCursor = end < rankedPosts.length ? end : null;

  return {
    posts: pagePosts,
    nextCursor,
    total: rankedPosts.length,
    storedAt,
    cacheHit,
  };
}
