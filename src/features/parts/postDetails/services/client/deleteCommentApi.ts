"use client";

import { apiPostR } from "@/lib/api";

export type DeleteCommentPayload = {
  commentId: string;
};

export async function deletePostCommentRequest(
  postId: string,
  payload: DeleteCommentPayload
): Promise<void> {
  const endpoint = `/post/${encodeURIComponent(postId)}/comments/delete`;
  await apiPostR(endpoint, payload);
}
