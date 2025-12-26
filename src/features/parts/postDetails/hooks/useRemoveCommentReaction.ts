"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PostReactionResponse } from "@/features/parts/post/types";

import { removeCommentReactionApi } from "../services/client/commentReactionsApi";
import { postCommentsQueryKey } from "./usePostComments";
import type { PostCommentsQueryData } from "./usePostComments";
import { updateCommentReactionInCache } from "./utils/commentReactionsCache";

export const REMOVE_COMMENT_REACTION_MUTATION_KEY = [
  "postDetails",
  "comments",
  "reaction",
  "remove",
] as const;

type UseRemoveCommentReactionOptions = {
  postId: string;
  parentId?: string | null;
};

export type RemoveCommentReactionVariables = {
  commentId: string;
};

type RemoveCommentReactionContext = {
  previousData?: PostCommentsQueryData;
};

export function useRemoveCommentReaction({
  postId,
  parentId = null,
}: UseRemoveCommentReactionOptions) {
  const queryClient = useQueryClient();
  const cacheKey = postCommentsQueryKey(postId, parentId);

  return useMutation<
    PostReactionResponse,
    Error,
    RemoveCommentReactionVariables,
    RemoveCommentReactionContext
  >({
    mutationKey: [...REMOVE_COMMENT_REACTION_MUTATION_KEY, postId, parentId],
    mutationFn: async ({ commentId }) =>
      removeCommentReactionApi({
        postId,
        commentId,
      }),
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const previousData =
        queryClient.getQueryData<PostCommentsQueryData>(cacheKey);
      updateCommentReactionInCache(queryClient, cacheKey, commentId, null);

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData);
      }
    },
  });
}
