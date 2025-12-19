"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import type { CreateCommentInput } from "../schemas";
import { createPostCommentRequest } from "../services/client/createCommentApi";
import commentMessages from "@/lib/messages/comments";

import type { PostComment } from "../services/client/createCommentApi";
import {
  postCommentsQueryKey,
  type PostCommentsQueryData,
} from "./usePostComments";
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
      toast.dismiss();
      toast.loading(commentMessages.created);

      const parentId = input.parentId ?? null;
      const cacheKey = postCommentsQueryKey(postId, parentId);

      await queryClient.cancelQueries({ queryKey: cacheKey });

      const previousData =
        queryClient.getQueryData<PostCommentsQueryData>(cacheKey);

      const optimisticComment = buildOptimisticComment({
        postId,
        parentId,
        content: input.content,
        viewer,
      });

      queryClient.setQueryData<PostCommentsQueryData>(cacheKey, (currentData) =>
        insertCommentAtTop(currentData, optimisticComment, undefined)
      );

      return {
        cacheKey,
        previousData,
        optimisticId: optimisticComment.id,
      };
    },
    onSuccess: async (comment, variables, context) => {
      toast.dismiss();
      toast.success(commentMessages.created);

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
    onError: (error, _variables, context) => {
      toast.dismiss();
      toast.error(error.message ?? commentMessages.unexpectedError, {
        duration: 5000,
      });

      if (context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousData);
      }
    },
  });
}

type CreateCommentContext = {
  cacheKey: ReturnType<typeof postCommentsQueryKey>;
  previousData: PostCommentsQueryData | undefined;
  optimisticId: string;
};
