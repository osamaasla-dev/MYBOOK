"use client";

import { apiPatchR } from "@/lib/api";

import type { UpdateCommentInput } from "@/features/parts/postDetails/schemas";
import { commentMessages } from "@/lib/messages";

type UpdateCommentResponse = {
  comment: {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    updatedAt: string | null;
    createdAt: string | null;
    isEdited: boolean;
  };
};

export type UpdateCommentPayload = UpdateCommentInput;

export async function updatePostCommentRequest(
  postId: string,
  payload: UpdateCommentPayload
) {
  if (!postId) {
    throw new Error(commentMessages.postNotFound);
  }
  if (!payload.commentId) {
    throw new Error(commentMessages.commentNotFound);
  }
  const endpoint = `/post/${encodeURIComponent(
    postId
  )}/comments/${encodeURIComponent(payload.commentId)}/update`;
  const { data } = await apiPatchR<UpdateCommentResponse>(endpoint, payload);
  return data.comment;
}
