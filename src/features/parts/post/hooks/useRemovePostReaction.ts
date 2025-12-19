"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removePostReactionApi } from "../services/client";
import type { PostReactionResponse } from "../types";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import {
  cancelRelatedQueries,
  invalidateHomeFeed,
  invalidatePostDetails,
  optimisticUpdateFeed,
  optimisticUpdatePostDetails,
  type ReactionMutationContext,
  type ReactionMutationVariables,
} from "./utils/reactMutationHelpers";
import {
  HOME_FEED_QUERY_KEY,
  type HomeFeedQueryData,
} from "@/features/pages/home/hooks/useHomeFeed";
import { postDetailsQueryKey } from "@/features/parts/postDetails/hooks";

export const REMOVE_POST_REACTION_MUTATION_KEY = [
  "post",
  "reaction",
  "remove",
] as const;

export type RemovePostReactionVariables = {
  postId: string;
  actionId?: number;
};

export function useRemovePostReaction() {
  const queryClient = useQueryClient();

  return useMutation<
    PostReactionResponse,
    Error,
    RemovePostReactionVariables,
    ReactionMutationContext
  >({
    mutationKey: REMOVE_POST_REACTION_MUTATION_KEY,
    mutationFn: ({ postId }) => removePostReactionApi(postId),
    onMutate: async (variables) => {
      await cancelRelatedQueries(queryClient, variables.postId);

      const previousHomeFeed =
        queryClient.getQueryData<HomeFeedQueryData>(HOME_FEED_QUERY_KEY);
      const previousPostDetails = queryClient.getQueryData<FeedPost>(
        postDetailsQueryKey(variables.postId)
      );

      const optimisticVariables: ReactionMutationVariables = {
        postId: variables.postId,
        reaction: null,
      };

      optimisticUpdateFeed(queryClient, optimisticVariables);
      optimisticUpdatePostDetails(queryClient, optimisticVariables);

      return { previousHomeFeed, previousPostDetails };
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        invalidateHomeFeed(queryClient),
        invalidatePostDetails(queryClient, variables.postId),
      ]);
    },
    onError: async (_error, variables, context) => {
      if (context?.previousHomeFeed) {
        queryClient.setQueryData(HOME_FEED_QUERY_KEY, context.previousHomeFeed);
      }

      if (context?.previousPostDetails) {
        queryClient.setQueryData(
          postDetailsQueryKey(variables.postId),
          context.previousPostDetails
        );
      }
    },
  });
}
