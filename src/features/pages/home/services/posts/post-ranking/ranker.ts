import {
  MAX_POSTS_PER_USER,
  scorePostCandidate,
  type PostRankingResult,
  type RankedPost,
} from "@/features/pages/home/utils/posts/post-ranking";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

import { fetchPostsForImportantUsers } from "./fetch";
import {
  createEmptyInteractionFlags,
  fetchViewerPostInteractions,
} from "./interactions";

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
): Promise<PostRankingResult> {
  const {
    viewerId,
    importantUsers,
    windowDays,
    perUserLimit = MAX_POSTS_PER_USER,
    maxTotalPosts,
    now = new Date(),
  } = params;

  if (!viewerId) {
    return { posts: [] };
  }

  const postFetchResults = await fetchPostsForImportantUsers(importantUsers, {
    viewerId,
    windowDays,
    perUserLimit,
    maxTotalPosts,
  });

  if (!postFetchResults.length) {
    return { posts: [] };
  }

  const importantUserScoreMap = new Map<string, number>();
  for (const user of importantUsers) {
    importantUserScoreMap.set(user.targetUserId, user.score);
  }

  const allPosts = postFetchResults.flatMap((result) => result.posts);
  if (!allPosts.length) {
    return { posts: [] };
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
        content: post.content,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewCount: post.viewCount,
        userScore: importantUserScoreMap.get(post.authorId) ?? 0,
        interactions:
          viewerInteractions.get(post.id) ?? createEmptyInteractionFlags(),
        author: post.author,
        privacy: post.privacy,
        viewerRelationship: post.viewerRelationship,
      },
      now
    );

    candidates.push(candidate);
  }

  if (!candidates.length) {
    return { posts: [] };
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

  const posts = perAuthorTop.sort((a, b) => b.finalScore - a.finalScore);

  return { posts };
}
