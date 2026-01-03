import {
  IMPORTANT_USER_POST_WINDOW_DAYS,
  MAX_POSTS_PER_USER,
  MAX_TOTAL_POSTS,
} from "../../../utils/posts/post-ranking";
import type {
  PostFetchResult,
  PostWithStats,
  ViewerRelationshipSnapshot,
} from "../../../utils/posts/post-ranking/types";
import type { ImportantUserScore } from "../../../utils/posts/user-ranking";
import { groupPostsByAuthor, queryRecentPosts } from "./fetch/index";
import { resolveEffectiveVisibility } from "./privacy";
import { Visibility } from "@prisma/client";
import { buildViewerRelationshipMap } from "./relationships";

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

  const relations = await buildViewerRelationshipMap(viewerId, authorIds);

  const posts = await queryRecentPosts({
    authorIds,
    since,
    limit: maxPosts,
    viewerId,
    relations,
  });
  if (!posts.length) return [];

  const hydratedPosts = hydratePostsWithPrivacy({
    posts,
    viewerId,
    relations,
  });

  if (!hydratedPosts.length) return [];

  return groupPostsByAuthor(hydratedPosts, perUserLimit);
}

type HydrateParams = {
  posts: Awaited<ReturnType<typeof queryRecentPosts>>;
  viewerId: string;
  relations: Map<string, ViewerRelationshipSnapshot>;
};

function hydratePostsWithPrivacy(params: HydrateParams): PostWithStats[] {
  const { posts, viewerId, relations } = params;

  return posts.map((post) => {
    const authorDefaultVisibility =
      post.authorDefaultVisibility ?? Visibility.PUBLIC;
    const effectiveVisibility = resolveEffectiveVisibility(
      post.visibility,
      post.visibilityPreference,
      authorDefaultVisibility
    );

    const relationship =
      relations.get(post.authorId) ??
      createDefaultRelationshipSnapshot(viewerId, post.authorId);

    return {
      id: post.id,
      authorId: post.authorId,
      publishedAt: post.publishedAt,
      reactionsCount: post.reactionsCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      viewCount: post.viewCount,
      privacy: {
        visibility: post.visibility,
        visibilityPreference: post.visibilityPreference,
        effectiveVisibility,
      },
      viewerRelationship: relationship,
    };
  });
}

function createDefaultRelationshipSnapshot(
  viewerId: string,
  authorId: string
): ViewerRelationshipSnapshot {
  return {
    isSelf: viewerId === authorId,
    isFriend: false,
    isFollower: false,
  };
}
