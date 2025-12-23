"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import commentMessages from "@/lib/messages/comments";
import type { PostReactionResponse } from "@/features/parts/post/types";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import {
  calculateReactionsCount,
  updateReactionSummary,
} from "@/features/parts/post/hooks/utils/reactionSummary";

import {
  reactToCommentApi,
  type ReactToCommentInput,
} from "../services/client/commentReactionsApi";
import { postCommentsQueryKey } from "./usePostComments";
import type { PostCommentsQueryData } from "./usePostComments";
import { updateCommentInCache } from "./utils/commentReactionsCache";

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
  const cacheKey = postCommentsQueryKey(postId, parentId);

  return useMutation<
    PostReactionResponse,
    Error,
    ReactToCommentVariables,
    ReactToCommentContext
  >({
    mutationKey: [...REACT_TO_COMMENT_MUTATION_KEY, postId, parentId],
    mutationFn: async ({ commentId, reaction }) => {
      if (!commentId) {
        throw new Error(commentMessages.commentNotFound);
      }
      if (!reaction) {
        throw new Error("Reaction type is required.");
      }

      return reactToCommentApi({
        postId,
        commentId,
        reaction,
      } satisfies ReactToCommentInput);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });

      const { commentId, reaction } = variables;
      if (!reaction) {
        throw new Error("Reaction type is required.");
      }

      const { didUpdate, previousData } = updateCommentInCache(
        queryClient,
        postId,
        parentId,
        commentId,
        (comment) => {
          if (comment.viewerReaction === reaction) {
            return comment;
          }

          const nextSummary = updateReactionSummary(
            comment.reactionSummary ?? {},
            reaction,
            comment.viewerReaction
          );

          return {
            ...comment,
            reactionSummary: nextSummary,
            reactionsCount: calculateReactionsCount(nextSummary),
            viewerReaction: reaction,
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
