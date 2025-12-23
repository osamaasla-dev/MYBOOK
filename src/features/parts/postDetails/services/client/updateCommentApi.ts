"use client";

import { apiPatchR } from "@/lib/api";

import type { UpdateCommentInput } from "@/features/parts/postDetails/schemas";

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
  const endpoint = `/post/${encodeURIComponent(
    postId
  )}/comments/${encodeURIComponent(payload.commentId)}/edit`;
  const { data } = await apiPatchR<UpdateCommentResponse>(endpoint, payload);
  return data.comment;
}
