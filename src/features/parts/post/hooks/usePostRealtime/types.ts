"use client";

import type { ReactionSummary } from "../../utils/reaction";

export type ReactionSummaryUpdatePayload = {
  postId: string;
  initiatorId: string;
  reactionSummary?: ReactionSummary | null;
  reactionsCount?: number;
  commentsCount?: number;
  sharesCount?: number;
};

export type PostDetailMetaEventPayload = {
  postId: string;
  initiatorId: string;
  reactionsCount?: number;
  reactionSummary?: ReactionSummary | null;
  commentsCount?: number;
  sharesCount?: number;
};

export type PostDetailCommentEventPayload = {
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  contentPreview?: string;
  contentHtml?: string | null;
  replyToId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isEdited?: boolean;
};

export type PostDetailCommentDeletedEventPayload = {
  postId: string;
  initiatorId: string;
  commentId: string;
  parentId?: string | null;
};

export type PostDetailCommentUpdatedEventPayload = {
  postId: string;
  commentId: string;
  authorId: string;

  parentId?: string | null;
  content?: string;
  updatedAt?: string;
  isEdited?: boolean;
};

export type CommentMetaEventPayload = {
  postId: string | null;
  initiatorId: string;
  commentId: string | null;
  parentId?: string | null;
  reactionsCount: number;
  reactionSummary: ReactionSummary;
  replyCount?: number;
  updatedAt: string;
};

export type usePostRealtimeOptions = {
  /**
   * Post being observed (needed for the detail/meta channel).
   */
  postId?: string;
  /**
   * Whether to subscribe to the user channel (authored posts).
   * Defaults to true when the current user exists.
   */
  enableUserChannel?: boolean;
  /**
   * Whether to subscribe to the post-details meta channel.
   * Defaults to true when postId is provided.
   */
  enablePostDetailChannel?: boolean;
};
