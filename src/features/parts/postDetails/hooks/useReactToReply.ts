"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PostReactionResponse } from "@/features/parts/post/types";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

import { reactToCommentApi } from "../services/client/commentReactionsApi";
import { commentRepliesQueryKey } from "./useReplies";
import type { CommentRepliesQueryData } from "./useReplies";
import { updateCommentReactionInCache } from "./utils/commentReactionsCache";

export const REACT_TO_REPLY_MUTATION_KEY = [
  "postDetails",
  "replies",
  "reaction",
  "add",
] as const;

type UseReactToReplyOptions = {
  postId: string;
  parentId: string;
};

export type ReactToReplyVariables = {
  commentId: string;
  reaction: PostReactionType;
};

type ReactToReplyContext = {
  previousData?: CommentRepliesQueryData;
};

export function useReactToReply({ postId, parentId }: UseReactToReplyOptions) {
  const queryClient = useQueryClient();
  const cacheKey = commentRepliesQueryKey(postId, parentId);

  return useMutation<
    PostReactionResponse,
    Error,
    ReactToReplyVariables,
    ReactToReplyContext
  >({
    mutationKey: [...REACT_TO_REPLY_MUTATION_KEY, postId, parentId],
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
        queryClient.getQueryData<CommentRepliesQueryData>(cacheKey);
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
