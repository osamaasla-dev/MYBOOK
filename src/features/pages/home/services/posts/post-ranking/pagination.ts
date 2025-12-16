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
      postsIds: [],
      nextCursor: null,
      total: 0,
      storedAt: null,
      cacheHit: false,
    };
  }

  const nowMs = now.getTime();
  const cached = await readRankedPostsCache(viewerId);
  let rankedPostsIds = cached?.postsIds ?? [];
  let storedAt = cached?.storedAt ?? null;
  let cacheHit = Boolean(rankedPostsIds.length);
  const isStale =
    Boolean(storedAt) && nowMs - (storedAt as number) > RANKED_POSTS_STALE_MS;

  if (rankedPostsIds.length && isStale) {
    scheduleRevalidation({
      viewerId,
      importantUsers,
      windowDays,
      perUserLimit,
      maxTotalPosts,
    });
  }

  if (!rankedPostsIds.length) {
    const freshlyRanked = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers,
      windowDays,
      perUserLimit,
      maxTotalPosts,
      now,
    });

    rankedPostsIds = freshlyRanked.postsIds;
    storedAt = rankedPostsIds.length ? nowMs : null;
    cacheHit = false;

    if (rankedPostsIds.length) {
      await writeRankedPostsCache(viewerId, rankedPostsIds);
    } else {
      await clearRankedPostsCache(viewerId);
    }
  }

  if (!rankedPostsIds.length) {
    return {
      postsIds: [],
      nextCursor: null,
      total: 0,
      storedAt,
      cacheHit,
    };
  }

  const start = cursor;
  const end = cursor + pageSize;
  const pagePosts = rankedPostsIds.slice(start, end);
  const nextCursor = end < rankedPostsIds.length ? end : null;

  return {
    postsIds: pagePosts,
    nextCursor,
    total: rankedPostsIds.length,
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

    if (ranked.postsIds.length) {
      await writeRankedPostsCache(viewerId, ranked.postsIds);
    } else {
      await clearRankedPostsCache(viewerId);
    }
  } catch (error) {
    console.error("ranked feed revalidation failed", error);
  }
}
