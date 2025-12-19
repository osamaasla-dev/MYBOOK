"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  HOME_FEED_QUERY_KEY,
  type HomeFeedQueryData,
} from "@/features/pages/home/hooks/useHomeFeed";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { postDetailsQueryKey } from "@/features/parts/postDetails/hooks";

import type { ReactionSummaryUpdatePayload } from "./types";

function updateHomeFeedCache(
  queryClient: QueryClient,
  payload: ReactionSummaryUpdatePayload
) {
  queryClient.setQueryData<HomeFeedQueryData | undefined>(
    HOME_FEED_QUERY_KEY,
    (current) => {
      if (!current) return current;

      let didChange = false;
      const applyUpdate = (post: FeedPost) => {
        if (post.postId !== payload.postId) return post;

        const hasSummaryUpdate = payload.reactionSummary !== undefined;
        const nextSummary = hasSummaryUpdate
          ? payload.reactionSummary ?? undefined
          : post.reactionSummary;
        const nextReactionsCount =
          typeof payload.reactionsCount === "number"
            ? payload.reactionsCount
            : post.reactionsCount;
        const nextCommentsCount =
          typeof payload.commentsCount === "number"
            ? payload.commentsCount
            : post.commentsCount;
        const nextSharesCount =
          typeof payload.sharesCount === "number"
            ? payload.sharesCount
            : post.sharesCount;

        if (
          nextSummary === post.reactionSummary &&
          nextReactionsCount === post.reactionsCount &&
          nextCommentsCount === post.commentsCount &&
          nextSharesCount === post.sharesCount
        ) {
          return post;
        }

        didChange = true;
        return {
          ...post,
          reactionSummary: nextSummary,
          reactionsCount: nextReactionsCount,
          commentsCount: nextCommentsCount,
          sharesCount: nextSharesCount,
        };
      };

      const updatedPages = (current.pages ?? []).map((page) => ({
        ...page,
        posts: (page.posts ?? []).map(applyUpdate),
      }));

      const updatedPosts = (current.posts ?? []).map(applyUpdate);

      if (!didChange) return current;

      return {
        ...current,
        pages: updatedPages,
        posts: updatedPosts,
      };
    }
  );
}

function updatePostDetailsCache(
  queryClient: QueryClient,
  payload: ReactionSummaryUpdatePayload
) {
  queryClient.setQueryData<FeedPost | undefined>(
    postDetailsQueryKey(payload.postId),
    (current) => {
      if (!current) return current;

      const hasSummaryUpdate = payload.reactionSummary !== undefined;
      const nextSummary = hasSummaryUpdate
        ? payload.reactionSummary ?? undefined
        : current.reactionSummary;
      const nextReactionsCount =
        typeof payload.reactionsCount === "number"
          ? payload.reactionsCount
          : current.reactionsCount;
      const nextCommentsCount =
        typeof payload.commentsCount === "number"
          ? payload.commentsCount
          : current.commentsCount;
      const nextSharesCount =
        typeof payload.sharesCount === "number"
          ? payload.sharesCount
          : current.sharesCount;

      if (
        nextSummary === current.reactionSummary &&
        nextReactionsCount === current.reactionsCount &&
        nextCommentsCount === current.commentsCount &&
        nextSharesCount === current.sharesCount
      ) {
        return current;
      }

      return {
        ...current,
        reactionSummary: nextSummary,
        reactionsCount: nextReactionsCount,
        commentsCount: nextCommentsCount,
        sharesCount: nextSharesCount,
      };
    }
  );
}

export function applyCacheUpdates(
  queryClient: QueryClient,
  payload: ReactionSummaryUpdatePayload
) {
  if (!payload.postId) return;
  updateHomeFeedCache(queryClient, payload);
  updatePostDetailsCache(queryClient, payload);
}
