"use client";

import { apiPostR } from "@/lib/api";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type { CreateCommentInput } from "@/features/parts/postDetails/schemas";

type CommentAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  reactionSummary: ReactionSummary | null;
  reactionsCount: number;
  viewerReaction: PostReactionType | null;
  createdAt: string | null;
  updatedAt: string | null;
  author: CommentAuthor;
};

type CreateCommentResponse = {
  comment: PostComment;
};

const buildAddCommentEndpoint = (postId: string) =>
  `/post/${encodeURIComponent(postId)}/comments/create`;

export async function createPostCommentRequest(
  postId: string,
  input: CreateCommentInput
): Promise<PostComment> {
  const endpoint = buildAddCommentEndpoint(postId);
  const { data } = await apiPostR<CreateCommentResponse>(endpoint, input);
  return {
    ...data.comment,
    reactionsCount: 0,
    viewerReaction: null,
  };
}
