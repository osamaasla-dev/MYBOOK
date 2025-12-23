"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import commentMessages from "@/lib/messages/comments";

import {
  updatePostCommentRequest,
  type UpdateCommentPayload,
} from "../services/client/updateCommentApi";
import {
  postCommentsQueryKey,
  type PostCommentsQueryData,
} from "./usePostComments";

export const UPDATE_COMMENT_MUTATION_KEY = [
  "postDetails",
  "comments",
  "update",
] as const;

type UseUpdatePostCommentOptions = {
  postId: string;
  parentId?: string | null;
};

export function useUpdatePostComment({
  postId,
  parentId = null,
}: UseUpdatePostCommentOptions) {
  const queryClient = useQueryClient();
  const cacheKey = postCommentsQueryKey(postId, parentId);

  return useMutation({
    mutationKey: [...UPDATE_COMMENT_MUTATION_KEY, postId, parentId],
    mutationFn: async (payload: UpdateCommentPayload) => {
      if (!postId) {
        throw new Error(commentMessages.postNotFound);
      }
      if (!payload.commentId) {
        throw new Error(commentMessages.commentNotFound);
      }

      return updatePostCommentRequest(postId, payload);
    },
    onSuccess: async (updatedComment) => {
      queryClient.setQueryData<PostCommentsQueryData | undefined>(
        cacheKey,
        (currentData) => {
          if (!currentData) return currentData;
          if (
            !Array.isArray(currentData.pages) ||
            currentData.pages.length === 0
          ) {
            return currentData;
          }

          const nextUpdatedAt =
            updatedComment.updatedAt ?? new Date().toISOString();

          const mapComment = <T extends { id: string }>(comment: T) =>
            comment.id === updatedComment.id
              ? {
                  ...comment,
                  content: updatedComment.content,
                  updatedAt: nextUpdatedAt,
                  isEdited: true,
                }
              : comment;

          return {
            ...currentData,
            pages: currentData.pages.map((page) => {
              if (!Array.isArray(page?.comments)) {
                return page;
              }
              return {
                ...page,
                comments: page.comments.map(mapComment),
              };
            }),
            items: Array.isArray(currentData.items)
              ? currentData.items.map(mapComment)
              : currentData.items,
          };
        }
      );
    },
  });
}
