"use client";

import { apiGetR } from "@/lib/api";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";

export type CommentAuthorSummary = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type PostCommentListItem = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  reactionSummary: ReactionSummary | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthorSummary;
};

export type FetchPostCommentsResponse = {
  comments: PostCommentListItem[];
  nextCursor: string | null;
};

export type FetchPostCommentsParams = {
  postId: string;
  parentId?: string | null;
  cursor?: string | null;
  limit?: number;
};

const buildCommentsQuery = ({
  postId,
  parentId,
  cursor,
  limit,
}: FetchPostCommentsParams) => {
  const searchParams = new URLSearchParams();

  if (parentId) {
    searchParams.set("parentId", parentId);
  }
  if (cursor) {
    searchParams.set("cursor", cursor);
  }
  if (limit) {
    searchParams.set("limit", String(limit));
  }

  const query = searchParams.toString();
  const base = `/post/${encodeURIComponent(postId)}/comments`;
  return query ? `${base}?${query}` : base;
};

export async function fetchPostCommentsRequest(
  params: FetchPostCommentsParams
): Promise<FetchPostCommentsResponse> {
  const endpoint = buildCommentsQuery(params);
  const { data } = await apiGetR<FetchPostCommentsResponse>(endpoint);
  return data;
}
