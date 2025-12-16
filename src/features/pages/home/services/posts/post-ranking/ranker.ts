import {
  MAX_POSTS_PER_USER,
  scorePostCandidate,
  TOP_IMPORTANT_PERCENTILE,
  type PostsRankingResult,
  type RankedPost,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

import { fetchPostsForImportantUsers } from "./fetch";
import {
  createEmptyInteractionFlags,
  fetchViewerPostInteractions,
} from "./interactions";
import { extractImportantFreshPosts, extractViewerFreshPosts } from "./buckets";

export type RankPostsParams = {
  viewerId: string;
  importantUsers: ImportantUserScore[];
  windowDays?: number;
  perUserLimit?: number;
  maxTotalPosts?: number;
  now?: Date;
};

export async function rankPostsForImportantUsersFeed(
  params: RankPostsParams
): Promise<PostsRankingResult> {
  const {
    viewerId,
    importantUsers,
    windowDays,
    perUserLimit = MAX_POSTS_PER_USER,
    maxTotalPosts,
    now = new Date(),
  } = params;

  if (!viewerId) {
    return { postsIds: [] };
  }

  const postFetchResults = await fetchPostsForImportantUsers(importantUsers, {
    viewerId,
    windowDays,
    perUserLimit,
    maxTotalPosts,
  });

  if (!postFetchResults.length) {
    return { postsIds: [] };
  }

  const importantUserScoreMap = new Map<string, number>();
  for (const user of importantUsers) {
    importantUserScoreMap.set(user.targetUserId, user.score);
  }

  const allPosts = postFetchResults.flatMap((result) => result.posts);
  if (!allPosts.length) {
    return { postsIds: [] };
  }

  const postIds = allPosts.map((post) => post.id);
  const viewerInteractions = await fetchViewerPostInteractions(
    viewerId,
    postIds
  );

  const candidates: RankedPost[] = [];
  for (const post of allPosts) {
    const candidate = scorePostCandidate(
      {
        postId: post.id,
        authorId: post.authorId,
        publishedAt: post.publishedAt,
        reactionsCount: post.reactionsCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewCount: post.viewCount,
        userScore: importantUserScoreMap.get(post.authorId) ?? 0,
        interactions:
          viewerInteractions.get(post.id) ?? createEmptyInteractionFlags(),

        privacy: post.privacy,
        viewerRelationship: post.viewerRelationship,
      },
      now
    );

    candidates.push(candidate);
  }

  if (!candidates.length) {
    return { postsIds: [] };
  }

  const perAuthor = new Map<string, RankedPost[]>();
  for (const ranked of candidates) {
    const list = perAuthor.get(ranked.authorId) ?? [];
    list.push(ranked);
    perAuthor.set(ranked.authorId, list);
  }

  const perAuthorTop: RankedPost[] = [];
  for (const [, list] of perAuthor.entries()) {
    list.sort((a, b) => b.finalScore - a.finalScore);
    perAuthorTop.push(...list.slice(0, perUserLimit));
  }

  const sortedClassic = perAuthorTop.sort(
    (a, b) => b.finalScore - a.finalScore
  );

  const topImportantUserIds = determineTopImportantUsers({
    importantUsers,
    viewerId,
  });

  const { bucket: viewerFresh, remaining: afterViewerFresh } =
    extractViewerFreshPosts({
      posts: sortedClassic,
      viewerId,
      now,
    });

  const { bucket: importantFresh, remaining: classicPool } =
    extractImportantFreshPosts({
      posts: afterViewerFresh,
      topImportantUserIds,
      viewerId,
      now,
    });

  const classicFeed = classicPool.sort((a, b) => b.finalScore - a.finalScore);
  const posts = [...viewerFresh, ...importantFresh, ...classicFeed];

  return { postsIds: posts.map((post) => post.postId) };
}

function determineTopImportantUsers({
  importantUsers,
  viewerId,
}: {
  importantUsers: ImportantUserScore[];
  viewerId: string;
}) {
  if (!importantUsers.length) {
    return new Set<string>();
  }

  const sorted = [...importantUsers]
    .filter((user) => user.targetUserId !== viewerId)
    .sort((a, b) => b.score - a.score);

  if (!sorted.length) {
    return new Set<string>();
  }

  const count = Math.max(
    1,
    Math.floor(sorted.length * TOP_IMPORTANT_PERCENTILE)
  );
  const topUsers = sorted.slice(0, count).map((user) => user.targetUserId);

  return new Set(topUsers);
}
