"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PostReactionResponse } from "@/features/parts/post/types";

import { removeCommentReactionApi } from "../services/client/commentReactionsApi";
import { commentRepliesQueryKey } from "./useReplies";
import type { CommentRepliesQueryData } from "./useReplies";
import { updateCommentReactionInCache } from "./utils/commentReactionsCache";

export const REMOVE_REPLY_REACTION_MUTATION_KEY = [
  "postDetails",
  "replies",
  "reaction",
  "remove",
] as const;

type UseRemoveReplyReactionOptions = {
  postId: string;
  parentId: string;
};

export type RemoveReplyReactionVariables = {
  commentId: string;
};

type RemoveReplyReactionContext = {
  previousData?: CommentRepliesQueryData;
};

export function useRemoveReplyReaction({
  postId,
  parentId,
}: UseRemoveReplyReactionOptions) {
  const queryClient = useQueryClient();
  const cacheKey = commentRepliesQueryKey(postId, parentId);

  return useMutation<
    PostReactionResponse,
    Error,
    RemoveReplyReactionVariables,
    RemoveReplyReactionContext
  >({
    mutationKey: [...REMOVE_REPLY_REACTION_MUTATION_KEY, postId, parentId],
    mutationFn: async ({ commentId }) =>
      removeCommentReactionApi({
        postId,
        commentId,
      }),
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const previousData =
        queryClient.getQueryData<CommentRepliesQueryData>(cacheKey);
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
