import {
  DEFAULT_FEED_PAGE_SIZE,
  RANKED_POSTS_STALE_MS,
  type RankedFeedPage,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

import {
  clearRankedPostsCache,
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
    now = new Date(),
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

  const nowMs = now.getTime();
  const cached = await readRankedPostsCache(viewerId);
  let rankedPosts = cached?.posts;
  let storedAt = cached?.storedAt ?? null;
  let cacheHit = Boolean(rankedPosts && rankedPosts.length);
  const isStale =
    Boolean(storedAt) && nowMs - (storedAt as number) > RANKED_POSTS_STALE_MS;

  if (rankedPosts?.length && isStale) {
    scheduleRevalidation({
      viewerId,
      importantUsers,
      windowDays,
      perUserLimit,
      maxTotalPosts,
    });
  }

  if (!rankedPosts || !rankedPosts.length) {
    const freshlyRanked = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers,
      windowDays,
      perUserLimit,
      maxTotalPosts,
      now,
    });

    rankedPosts = freshlyRanked.posts;
    storedAt = rankedPosts.length ? nowMs : null;
    cacheHit = false;

    if (rankedPosts.length) {
      await writeRankedPostsCache(viewerId, rankedPosts);
    } else {
      await clearRankedPostsCache(viewerId);
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

type RevalidationParams = {
  viewerId: string;
  importantUsers: ImportantUserScore[];
  windowDays?: number;
  perUserLimit?: number;
  maxTotalPosts?: number;
};

const pendingRevalidations = new Map<string, Promise<void>>();

function scheduleRevalidation(params: RevalidationParams) {
  const { viewerId } = params;
  if (pendingRevalidations.has(viewerId)) {
    return;
  }

  const task = revalidateRankedFeed(params).finally(() => {
    pendingRevalidations.delete(viewerId);
  });

  pendingRevalidations.set(viewerId, task);
}

async function revalidateRankedFeed(params: RevalidationParams) {
  const { viewerId } = params;
  if (!viewerId) return;

  try {
    const ranked = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers: params.importantUsers,
      windowDays: params.windowDays,
      perUserLimit: params.perUserLimit,
      maxTotalPosts: params.maxTotalPosts,
      now: new Date(),
    });

    if (ranked.posts.length) {
      await writeRankedPostsCache(viewerId, ranked.posts);
    } else {
      await clearRankedPostsCache(viewerId);
    }
  } catch (error) {
    console.error("ranked feed revalidation failed", error);
  }
}
