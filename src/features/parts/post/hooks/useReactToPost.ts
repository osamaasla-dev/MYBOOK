"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reactToPostApi } from "../services/client";
import type { PostReactionResponse } from "../types";
import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import {
  cancelRelatedQueries,
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

export const REACT_TO_POST_MUTATION_KEY = [
  "post",
  "reaction",
  "react",
] as const;

export function useReactToPost() {
  const queryClient = useQueryClient();

  return useMutation<
    PostReactionResponse,
    Error,
    ReactionMutationVariables,
    ReactionMutationContext
  >({
    mutationKey: REACT_TO_POST_MUTATION_KEY,
    mutationFn: ({ postId, reaction }) => {
      if (!reaction) {
        throw new Error("Reaction type is required.");
      }
      return reactToPostApi(postId, reaction);
    },
    onMutate: async (variables) => {
      await cancelRelatedQueries(queryClient, variables.postId);
      const previousHomeFeed =
        queryClient.getQueryData<HomeFeedQueryData>(HOME_FEED_QUERY_KEY);
      const previousPostDetails = queryClient.getQueryData<FeedPost>(
        postDetailsQueryKey(variables.postId)
      );
      optimisticUpdateFeed(queryClient, variables);

      optimisticUpdatePostDetails(queryClient, variables);
      return { previousHomeFeed, previousPostDetails };
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
