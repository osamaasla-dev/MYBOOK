"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updatePostCommentRequest,
  type UpdateCommentPayload,
} from "../services/client/updateCommentApi";
import { commentRepliesQueryKey } from "./useReplies";
import { updateCommentInCache } from "./utils";

export const UPDATE_REPLY_MUTATION_KEY = [
  "postDetails",
  "replies",
  "update",
] as const;

type UseUpdateReplyOptions = {
  postId: string;
  parentId: string;
};

export function useUpdateReply({ postId, parentId }: UseUpdateReplyOptions) {
  const queryClient = useQueryClient();
  const cacheKey = commentRepliesQueryKey(postId, parentId);

  return useMutation({
    mutationKey: [...UPDATE_REPLY_MUTATION_KEY, postId, parentId],
    mutationFn: async (payload: UpdateCommentPayload) =>
      updatePostCommentRequest(postId, payload),
    onSuccess: async (updatedComment) => {
      updateCommentInCache(queryClient, cacheKey, updatedComment);
    },
  });
}
