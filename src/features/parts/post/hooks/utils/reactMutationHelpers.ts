"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { PostReactionType } from "../../constants/reactions";
import {
  HOME_FEED_QUERY_KEY,
  type HomeFeedQueryData,
} from "@/features/pages/home/hooks/useHomeFeed";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import { postDetailsQueryKey } from "@/features/parts/postDetails/hooks";
import {
  calculateReactionsCount,
  updateReactionSummary,
} from "./reactionSummary";

export type ReactionMutationVariables = {
  postId: string;
  reaction: PostReactionType | null;
  actionId?: number;
};

export type ReactionMutationContext = {
  previousHomeFeed?: HomeFeedQueryData;
  previousPostDetails?: FeedPost;
};

export async function cancelRelatedQueries(
  queryClient: QueryClient,
  postId: string
) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: HOME_FEED_QUERY_KEY }),
    queryClient.cancelQueries({ queryKey: postDetailsQueryKey(postId) }),
  ]);
}

export function optimisticUpdateFeed(
  queryClient: QueryClient,
  variables: ReactionMutationVariables
) {
  queryClient.setQueryData<HomeFeedQueryData | undefined>(
    HOME_FEED_QUERY_KEY,
    (current) => {
      if (!current) return current;

      const updatedPages = current.pages.map((page) => ({
        ...page,
        posts: page.posts.map((post) => {
          if (post.postId !== variables.postId) return post;

          const updatedSummary = updateReactionSummary(
            post.reactionSummary ?? {},
            variables.reaction,
            post.interactions.viewerReaction
          );

          return {
            ...post,
            reactionsCount: calculateReactionsCount(updatedSummary),
            reactionSummary: updatedSummary,
            interactions: {
              ...post.interactions,
              viewerReaction: variables.reaction,
              hasLiked: Boolean(variables.reaction),
            },
          };
        }),
      }));

      const updatedPosts = updatedPages.flatMap((page) => page.posts);

      return { ...current, pages: updatedPages, posts: updatedPosts };
    }
  );
}

export function optimisticUpdatePostDetails(
  queryClient: QueryClient,
  variables: ReactionMutationVariables
) {
  queryClient.setQueryData<FeedPost | undefined>(
    postDetailsQueryKey(variables.postId),
    (current) => {
      if (!current) return current;

      const updatedSummary = updateReactionSummary(
        current.reactionSummary ?? {},
        variables.reaction,
        current.interactions.viewerReaction
      );

      return {
        ...current,
        reactionsCount: calculateReactionsCount(updatedSummary),
        reactionSummary: updatedSummary,
        interactions: {
          ...current.interactions,
          viewerReaction: variables.reaction,
        },
      };
    }
  );
}

export async function invalidateHomeFeed(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: HOME_FEED_QUERY_KEY });
}

export async function invalidatePostDetails(
  queryClient: QueryClient,
  postId: string
) {
  await queryClient.invalidateQueries({
    queryKey: postDetailsQueryKey(postId),
  });
}
