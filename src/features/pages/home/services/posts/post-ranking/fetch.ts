import {
  IMPORTANT_USER_POST_WINDOW_DAYS,
  MAX_POSTS_PER_USER,
  MAX_TOTAL_POSTS,
} from "../../../utils/posts/post-ranking";
import type { PostFetchResult } from "../../../utils/posts/post-ranking/types";
import type { ImportantUserScore } from "../../../utils/posts/user-ranking";
import {
  filterPostsByVisibility,
  groupPostsByAuthor,
  loadFetchDependencies,
  queryRecentPosts,
} from "./fetch/index";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export async function fetchPostsForImportantUsers(
  importantUsers: ImportantUserScore[],
  options: {
    viewerId: string;
    windowDays?: number;
    perUserLimit?: number;
    maxTotalPosts?: number;
  }
): Promise<PostFetchResult[]> {
  const viewerId = options.viewerId;
  if (!viewerId) return [];

  const windowDays = options.windowDays ?? IMPORTANT_USER_POST_WINDOW_DAYS;
  const perUserLimit = options.perUserLimit ?? MAX_POSTS_PER_USER;
  const maxPosts = options.maxTotalPosts ?? MAX_TOTAL_POSTS;

  const since = new Date(Date.now() - windowDays * MS_PER_DAY);

  const authorIds = Array.from(
    new Set([...importantUsers.map((user) => user.targetUserId), viewerId])
  );

  const { privacyDefaults, relations } = await loadFetchDependencies(
    viewerId,
    authorIds
  );

  const posts = await queryRecentPosts({
    authorIds,
    since,
    limit: maxPosts,
  });
  if (!posts.length) return [];

  const visiblePosts = filterPostsByVisibility({
    posts,
    viewerId,
    privacyDefaults,
    relations,
  });
  if (!visiblePosts.length) return [];

  return groupPostsByAuthor(visiblePosts, perUserLimit);
}
