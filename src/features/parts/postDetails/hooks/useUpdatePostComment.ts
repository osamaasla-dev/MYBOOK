"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updatePostCommentRequest,
  type UpdateCommentPayload,
} from "../services/client/updateCommentApi";
import { postCommentsQueryKey } from "./usePostComments";
import { updateCommentInCache } from "./utils";

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
    mutationFn: async (payload: UpdateCommentPayload) =>
      updatePostCommentRequest(postId, payload),
    onSuccess: async (updatedComment) => {
      updateCommentInCache(queryClient, cacheKey, updatedComment);
    },
  });
}
