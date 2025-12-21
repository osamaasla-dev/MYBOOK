"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateCommentInput } from "../schemas";
import { createPostCommentRequest } from "../services/client/createCommentApi";
import commentMessages from "@/lib/messages/comments";

import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import type { PostComment } from "../services/client/createCommentApi";
import {
  postCommentsQueryKey,
  type PostCommentsQueryData,
} from "./usePostComments";
import { postDetailsQueryKey } from "./usePostDetails";
import {
  buildOptimisticComment,
  insertCommentAtTop,
  mapPostCommentToListItem,
  type OptimisticViewer,
} from "./utils/commentCache";

export const CREATE_COMMENT_MUTATION_KEY = [
  "postDetails",
  "comments",
  "create",
] as const;

type UseCreatePostCommentOptions = {
  postId: string;
  viewer?: OptimisticViewer | null;
};

export function useCreatePostComment({
  postId,
  viewer = null,
}: UseCreatePostCommentOptions) {
  const queryClient = useQueryClient();

  return useMutation<
    PostComment,
    Error,
    CreateCommentInput,
    CreateCommentContext | undefined
  >({
    mutationKey: [...CREATE_COMMENT_MUTATION_KEY, postId],
    mutationFn: async (input) => {
      if (!postId) {
        throw new Error(commentMessages.postNotFound);
      }
      return createPostCommentRequest(postId, input);
    },
    onMutate: async (input) => {
      const parentId = input.parentId ?? null;
      const cacheKey = postCommentsQueryKey(postId, parentId);

      await queryClient.cancelQueries({ queryKey: cacheKey });
      const postDetailsKey = postDetailsQueryKey(postId);

      const previousData =
        queryClient.getQueryData<PostCommentsQueryData>(cacheKey);
      const previousPostDetails =
        queryClient.getQueryData<FeedPost>(postDetailsKey);

      const optimisticComment = buildOptimisticComment({
        postId,
        parentId,
        content: input.content,
        viewer,
      });

      queryClient.setQueryData<PostCommentsQueryData>(cacheKey, (currentData) =>
        insertCommentAtTop(currentData, optimisticComment, undefined)
      );

      queryClient.setQueryData<FeedPost | undefined>(
        postDetailsKey,
        (currentDetails) => {
          if (!currentDetails) return currentDetails;

          return {
            ...currentDetails,
            commentsCount: (currentDetails.commentsCount ?? 0) + 1,
          };
        }
      );

      return {
        cacheKey,
        previousData,
        optimisticId: optimisticComment.id,
        postDetailsKey,
        previousPostDetails,
      };
    },
    onSuccess: async (comment, variables, context) => {
      const parentId = variables.parentId ?? null;
      const cacheKey =
        context?.cacheKey ?? postCommentsQueryKey(postId, parentId);
      const normalizedComment = mapPostCommentToListItem(comment);

      queryClient.setQueryData<PostCommentsQueryData>(cacheKey, (currentData) =>
        insertCommentAtTop(
          currentData,
          normalizedComment,
          context?.optimisticId
        )
      );
    },
    onError: (_error, _variables, context) => {
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

type CreateCommentContext = {
  cacheKey: ReturnType<typeof postCommentsQueryKey>;
  previousData: PostCommentsQueryData | undefined;
  optimisticId: string;
  postDetailsKey: ReturnType<typeof postDetailsQueryKey>;
  previousPostDetails?: FeedPost;
};
