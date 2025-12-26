"use client";

import { apiPostR } from "@/lib/api";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type { CreateReplyInput } from "@/features/parts/postDetails/schemas";

type CommentAuthor = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type PostReply = {
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

type CreateReplyResponse = {
  reply: PostReply;
};

const buildCreateReplyEndpoint = (postId: string, commentId: string) =>
  `/post/${encodeURIComponent(postId)}/comments/${encodeURIComponent(
    commentId
  )}/replies/create`;

export async function createReplyRequest(
  postId: string,
  commentId: string,
  input: CreateReplyInput
): Promise<PostReply> {
  const endpoint = buildCreateReplyEndpoint(postId, commentId);
  const { data } = await apiPostR<CreateReplyResponse>(endpoint, input);
  return {
    ...data.reply,
    reactionsCount: 0,
    viewerReaction: null,
  };
}
