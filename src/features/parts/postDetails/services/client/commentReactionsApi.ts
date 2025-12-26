"use client";

import { apiDeleteR, apiGetR, apiPostR } from "@/lib/api";

import type { PostReactionResponse } from "@/features/parts/post/types";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type { CommentReactionsResponse } from "@/features/parts/postDetails/services/server/comment/reactions/types";
import { commentMessages } from "@/lib/messages";
import { CommentReactionTab } from "../server/comment/reactions/schema";

const buildCommentReactionEndpoint = (
  postId: string,
  commentId: string,
  action: "create" | "delete"
) =>
  `/post/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
    commentId
  )}/reactions/${action}`;

export type ReactToCommentInput = {
  postId: string;
  commentId: string;
  reaction: PostReactionType;
};

export async function reactToCommentApi({
  postId,
  commentId,
  reaction,
}: ReactToCommentInput): Promise<PostReactionResponse> {
  if (!commentId) {
    throw new Error(commentMessages.commentNotFound);
  }
  if (!reaction) {
    throw new Error("Reaction type is required.");
  }
  const endpoint = buildCommentReactionEndpoint(postId, commentId, "create");

  const { data } = await apiPostR<PostReactionResponse>(endpoint, { reaction });
  return data;
}

export type RemoveCommentReactionInput = {
  postId: string;
  commentId: string;
};

export async function removeCommentReactionApi({
  postId,
  commentId,
}: RemoveCommentReactionInput): Promise<PostReactionResponse> {
  if (!commentId || !postId) {
    throw new Error(commentMessages.commentNotFound);
  }
  const endpoint = buildCommentReactionEndpoint(postId, commentId, "delete");

  const { data } = await apiDeleteR<PostReactionResponse>(endpoint);
  return data;
}

const buildCommentReactionsListEndpoint = (postId: string, commentId: string) =>
  `/post/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
    commentId
  )}/reactions`;

export type FetchCommentReactionsPageInput = {
  postId: string;
  commentId: string;
  tab?: CommentReactionTab;
  limit?: number;
  cursor?: string;
};

export async function fetchCommentReactionsPage({
  postId,
  commentId,
  tab = "all",
  limit,
  cursor,
}: FetchCommentReactionsPageInput): Promise<CommentReactionsResponse> {
  const endpoint = buildCommentReactionsListEndpoint(postId, commentId);
  const { data } = await apiGetR<CommentReactionsResponse>(endpoint, {
    params: {
      tab,
      limit,
      cursor,
    },
  });
  return data;
}
