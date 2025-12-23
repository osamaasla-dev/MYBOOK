"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import commentMessages from "@/lib/messages/comments";
import type { PostReactionResponse } from "@/features/parts/post/types";
import {
  calculateReactionsCount,
  updateReactionSummary,
} from "@/features/parts/post/hooks/utils/reactionSummary";

import {
  removeCommentReactionApi,
  type RemoveCommentReactionInput,
} from "../services/client/commentReactionsApi";
import { postCommentsQueryKey } from "./usePostComments";
import type { PostCommentsQueryData } from "./usePostComments";
import { updateCommentInCache } from "./utils/commentReactionsCache";

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
    mutationFn: async ({ commentId }) => {
      if (!commentId) {
        throw new Error(commentMessages.commentNotFound);
      }

      return removeCommentReactionApi({
        postId,
        commentId,
      } satisfies RemoveCommentReactionInput);
    },
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });

      const { didUpdate, previousData } = updateCommentInCache(
        queryClient,
        postId,
        parentId,
        commentId,
        (comment) => {
          if (!comment.viewerReaction) {
            return comment;
          }

          const nextSummary = updateReactionSummary(
            comment.reactionSummary ?? {},
            null,
            comment.viewerReaction
          );

          return {
            ...comment,
            reactionSummary: nextSummary,
            reactionsCount: calculateReactionsCount(nextSummary),
            viewerReaction: null,
          };
        }
      );

      return { previousData: didUpdate ? previousData : undefined };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData);
      }
    },
  });
}
