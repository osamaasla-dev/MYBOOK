import { redis } from "@/lib/redis";

import { type PostReactionType } from "@/features/parts/post/constants/reactions";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";

import {
  RANKED_POSTS_CACHE_NAMESPACE,
  RANKED_POSTS_CACHE_TTL_SECONDS,
} from "./constants";
import type { RankedPost } from "./types";

export type RankedPostsCacheRecord = {
  storedAt: number;
  posts: RankedPost[];
};

function cacheKey(viewerId: string) {
  return `${RANKED_POSTS_CACHE_NAMESPACE}:${viewerId}`;
}

export async function readRankedPostsCache(
  viewerId: string
): Promise<RankedPostsCacheRecord | null> {
  if (!viewerId) return null;

  try {
    const record = await redis.get<RankedPostsCacheRecord>(cacheKey(viewerId));
    return record ?? null;
  } catch (error) {
    console.error("ranked posts cache read failed", error);
    return null;
  }
}

export async function writeRankedPostsCache(
  viewerId: string,
  posts: RankedPost[]
) {
  if (!viewerId) return;

  const payload: RankedPostsCacheRecord = {
    storedAt: Date.now(),
    posts,
  };

  try {
    await redis.set(cacheKey(viewerId), payload, {
      ex: RANKED_POSTS_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("ranked posts cache write failed", error);
  }
}

export async function clearRankedPostsCache(viewerId: string) {
  if (!viewerId) return;
  try {
    await redis.del(cacheKey(viewerId));
  } catch (error) {
    console.error("ranked posts cache clear failed", error);
  }
}

export type RankedPostCacheMutation = {
  reactionSummary?: ReactionSummary | null;
  viewerReaction?: PostReactionType | null;
  commentCount?: number;
  shareCount?: number;
};

export async function updateRankedPostCacheEntry(
  viewerId: string,
  postId: string,
  mutation: RankedPostCacheMutation
) {
  if (!viewerId || !postId) return;

  const cached = await readRankedPostsCache(viewerId);
  if (!cached?.posts?.length) return;

  const targetIndex = cached.posts.findIndex((post) => post.postId === postId);
  if (targetIndex === -1) return;

  const postsSnapshot = [...cached.posts];
  const currentPost = postsSnapshot[targetIndex];
  const nextReactionSummary =
    mutation.reactionSummary !== undefined
      ? mutation.reactionSummary
      : currentPost.reactionSummary;
  const nextViewerReaction =
    mutation.viewerReaction !== undefined
      ? mutation.viewerReaction
      : currentPost.interactions.viewerReaction;
  const nextCommentsCount =
    mutation.commentCount !== undefined
      ? mutation.commentCount
      : currentPost.commentsCount;
  const nextSharesCount =
    mutation.shareCount !== undefined
      ? mutation.shareCount
      : currentPost.sharesCount;

  const updatedPost: RankedPost = {
    ...currentPost,
    reactionSummary: nextReactionSummary ?? null,
    commentsCount: nextCommentsCount,
    sharesCount: nextSharesCount,
    viewerRelationship: {
      ...currentPost.viewerRelationship,
    },
    interactions: {
      ...currentPost.interactions,
      viewerReaction: nextViewerReaction ?? null,
    },
  };

  const targetChanged =
    nextReactionSummary !== currentPost.reactionSummary ||
    nextViewerReaction !== currentPost.interactions.viewerReaction ||
    nextCommentsCount !== currentPost.commentsCount ||
    nextSharesCount !== currentPost.sharesCount;

  if (!targetChanged) {
    return;
  }

  const updatedPosts = postsSnapshot;
  updatedPosts[targetIndex] = updatedPost;

  await writeRankedPostsCache(viewerId, updatedPosts);
}

type RelationshipMutation = {
  viewerId: string;
  authorId: string;
  isFriend?: boolean;
  isFollowing?: boolean;
};

export async function updateRankedPostRelationships(
  mutation: RelationshipMutation
) {
  const { viewerId, authorId, isFriend, isFollowing } = mutation;
  if (!viewerId || !authorId) return;

  const cached = await readRankedPostsCache(viewerId);
  if (!cached?.posts?.length) return;

  let mutated = false;
  const updatedPosts = cached.posts.map((post) => {
    if (post.authorId !== authorId) return post;

    const nextRelationship = {
      ...post.viewerRelationship,
      ...(isFriend !== undefined ? { isFriend } : {}),
      ...(isFollowing !== undefined ? { isFollower: isFollowing } : {}),
    };

    if (
      nextRelationship.isFriend === post.viewerRelationship.isFriend &&
      nextRelationship.isFollower === post.viewerRelationship.isFollower
    ) {
      return post;
    }

    mutated = true;
    return {
      ...post,
      viewerRelationship: nextRelationship,
    };
  });

  if (!mutated) return;

  await writeRankedPostsCache(viewerId, updatedPosts);
}
