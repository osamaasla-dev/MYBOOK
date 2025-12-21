"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import commentMessages from "@/lib/messages/comments";

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import {
  deletePostCommentRequest,
  type DeleteCommentPayload,
} from "../services/client/deleteCommentApi";
import {
  postCommentsQueryKey,
  type PostCommentsQueryData,
} from "./usePostComments";
import { postDetailsQueryKey } from "./usePostDetails";
import { removeCommentFromCache } from "./utils";

export const DELETE_COMMENT_MUTATION_KEY = [
  "postDetails",
  "comments",
  "delete",
] as const;

type UseDeletePostCommentOptions = {
  postId: string;
  parentId?: string | null;
};

type DeleteCommentContext = {
  cacheKey: ReturnType<typeof postCommentsQueryKey>;
  previousData?: PostCommentsQueryData;
  postDetailsKey: ReturnType<typeof postDetailsQueryKey>;
  previousPostDetails?: FeedPost;
};

export function useDeletePostComment({
  postId,
  parentId = null,
}: UseDeletePostCommentOptions) {
  const queryClient = useQueryClient();
  const cacheKey = postCommentsQueryKey(postId, parentId);

  return useMutation<void, Error, DeleteCommentPayload, DeleteCommentContext>({
    mutationKey: [...DELETE_COMMENT_MUTATION_KEY, postId, parentId],
    mutationFn: async (payload) => {
      if (!postId) {
        throw new Error(commentMessages.postNotFound);
      }
      if (!payload.commentId) {
        throw new Error(commentMessages.commentNotFound);
      }
      await deletePostCommentRequest(postId, payload);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const previousData =
        queryClient.getQueryData<PostCommentsQueryData>(cacheKey);
      const postDetailsKey = postDetailsQueryKey(postId);
      const previousPostDetails =
        queryClient.getQueryData<FeedPost>(postDetailsKey);

      queryClient.setQueryData<PostCommentsQueryData | undefined>(
        cacheKey,
        (currentData) =>
          removeCommentFromCache(currentData, variables.commentId)
      );

      queryClient.setQueryData<FeedPost | undefined>(
        postDetailsKey,
        (currentDetails) => {
          if (!currentDetails) return currentDetails;

          return {
            ...currentDetails,
            commentsCount: Math.max((currentDetails.commentsCount ?? 0) - 1, 0),
          };
        }
      );

      return { cacheKey, previousData, postDetailsKey, previousPostDetails };
    },

    onError: (error, _variables, context) => {
      if (context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousData);
      }

      if (context?.postDetailsKey) {
        queryClient.setQueryData(
          context.postDetailsKey,
          context.previousPostDetails
        );
      }
    },
  });
}
