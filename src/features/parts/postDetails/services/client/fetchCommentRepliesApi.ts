"use client";

import { apiGetR } from "@/lib/api";

import type { PostCommentListItem } from "./fetchPostCommentsApi";

export type CommentReply = PostCommentListItem;

export type FetchCommentRepliesResponse = {
  replies: CommentReply[];
  nextCursor: string | null;
};

export type FetchCommentRepliesParams = {
  postId: string;
  commentId: string;
  cursor?: string | null;
  limit?: number;
};

const buildRepliesQuery = ({
  postId,
  commentId,
  cursor,
  limit,
}: FetchCommentRepliesParams) => {
  const searchParams = new URLSearchParams();

  if (cursor) {
    searchParams.set("cursor", cursor);
  }
  if (limit) {
    searchParams.set("limit", String(limit));
  }

  const query = searchParams.toString();
  const base = `/post/${encodeURIComponent(
    postId
  )}/comments/${encodeURIComponent(commentId)}/replies`;
  return query ? `${base}?${query}` : base;
};

export async function fetchCommentRepliesRequest(
  params: FetchCommentRepliesParams
): Promise<FetchCommentRepliesResponse> {
  const endpoint = buildRepliesQuery(params);
  const { data } = await apiGetR<FetchCommentRepliesResponse>(endpoint);
  return data;
}
