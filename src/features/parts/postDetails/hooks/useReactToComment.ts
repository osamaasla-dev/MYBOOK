"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PostReactionResponse } from "@/features/parts/post/types";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

import { reactToCommentApi } from "../services/client/commentReactionsApi";
import { postCommentsQueryKey } from "./usePostComments";
import type { PostCommentsQueryData } from "./usePostComments";
import { updateCommentReactionInCache } from "./utils/commentReactionsCache";

export const REACT_TO_COMMENT_MUTATION_KEY = [
  "postDetails",
  "comments",
  "reaction",
  "add",
] as const;

type UseReactToCommentOptions = {
  postId: string;
  parentId?: string | null;
};

export type ReactToCommentVariables = {
  commentId: string;
  reaction: PostReactionType;
};

type ReactToCommentContext = {
  previousData?: PostCommentsQueryData;
};

export function useReactToComment({
  postId,
  parentId = null,
}: UseReactToCommentOptions) {
  const queryClient = useQueryClient();
  const cacheKey = postCommentsQueryKey(postId);

  return useMutation<
    PostReactionResponse,
    Error,
    ReactToCommentVariables,
    ReactToCommentContext
  >({
    mutationKey: [...REACT_TO_COMMENT_MUTATION_KEY, postId, parentId],
    mutationFn: async ({ commentId, reaction }) =>
      reactToCommentApi({
        postId,
        commentId,
        reaction,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });

      const { commentId, reaction } = variables;
      const previousData =
        queryClient.getQueryData<PostCommentsQueryData>(cacheKey);

      updateCommentReactionInCache(queryClient, cacheKey, commentId, reaction);

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData);
      }
    },
  });
}
