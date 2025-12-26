"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateCommentInput } from "../schemas";
import { createPostCommentRequest } from "../services/client/createCommentApi";
import commentMessages from "@/lib/messages/comments";

import type { PostComment } from "../services/client/createCommentApi";
import {
  commentRepliesQueryKey,
  type CommentRepliesQueryData,
} from "./useReplies";
import {
  buildOptimisticComment,
  changeDirectParentReplyCount,
  changePostDetailsCommentsCount,
  insertCommentAtTop,
  mapPostCommentToListItem,
  type OptimisticViewer,
} from "./utils/commentCache";
import { PostCommentsQueryData, postCommentsQueryKey } from "./usePostComments";
import { postDetailsQueryKey } from "./usePostDetails";

export const CREATE_REPLY_MUTATION_KEY = [
  "comments",
  "replies",
  "create",
] as const;

type UseCreateReplyOptions = {
  postId: string;
  parentId: string;
  viewer?: OptimisticViewer | null;
  parentIdOfParent?: string | null;
};

export function useCreateReply({
  postId,
  parentId,

  viewer = null,
}: UseCreateReplyOptions) {
  const queryClient = useQueryClient();
  const cacheKey = commentRepliesQueryKey(postId, parentId);
  const parentCacheKey = postCommentsQueryKey(postId, null);
  const postDetailsKey = postDetailsQueryKey(postId);
  return useMutation<
    PostComment,
    Error,
    Omit<CreateCommentInput, "parentId">,
    CreateReplyContext | undefined
  >({
    mutationKey: [...CREATE_REPLY_MUTATION_KEY, postId, parentId],
    mutationFn: async (input) => {
      if (!postId || !parentId) {
        throw new Error(commentMessages.commentNotFound);
      }

      return createPostCommentRequest(postId, {
        ...input,
        parentId,
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: cacheKey });

      const previousData =
        queryClient.getQueryData<CommentRepliesQueryData>(cacheKey);

      const optimisticReply = buildOptimisticComment({
        postId,
        parentId,
        content: input.content,
        viewer,
      });

      queryClient.setQueryData<CommentRepliesQueryData>(
        cacheKey,
        (currentData) => insertCommentAtTop(currentData, optimisticReply)
      );

      // Update the parent comment's reply count in the main comments query
      changeDirectParentReplyCount(queryClient, parentCacheKey, parentId, 1);

      changePostDetailsCommentsCount(queryClient, postDetailsKey, 1);
      return {
        cacheKey,
        previousData,
        parentCacheKey,
        parentPreviousData:
          queryClient.getQueryData<PostCommentsQueryData>(parentCacheKey),
        optimisticId: optimisticReply.id,
      };
    },
    onSuccess: (reply, _variables, context) => {
      if (!context) return;

      const normalized = mapPostCommentToListItem(reply);

      queryClient.setQueryData<CommentRepliesQueryData>(
        context.cacheKey,
        (currentData) =>
          insertCommentAtTop(currentData, normalized, context.optimisticId)
      );
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      // Rollback replies list
      if (context.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousData);
      }

      // Rollback parent comment's reply count
      if (context.parentCacheKey) {
        queryClient.setQueryData(
          context.parentCacheKey,
          context.parentPreviousData
        );
      }
    },
  });
}

type CreateReplyContext = {
  cacheKey: ReturnType<typeof commentRepliesQueryKey>;
  previousData: CommentRepliesQueryData | undefined;
  parentCacheKey: ReturnType<typeof postCommentsQueryKey>;
  parentPreviousData: PostCommentsQueryData | undefined;
  optimisticId: string;
};
