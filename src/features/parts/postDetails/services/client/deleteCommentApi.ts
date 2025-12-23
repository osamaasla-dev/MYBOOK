"use client";

import { apiDeleteR } from "@/lib/api";

export type DeleteCommentPayload = {
  commentId: string;
};

export async function deletePostCommentRequest(
  postId: string,
  payload: DeleteCommentPayload
): Promise<void> {
  const endpoint = `/post/${encodeURIComponent(
    postId
  )}/comments/${encodeURIComponent(payload.commentId)}/delete`;
  await apiDeleteR(endpoint);
}
