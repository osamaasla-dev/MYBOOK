"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  insertCommentAtTop,
  removeCommentFromCache,
} from "@/features/parts/postDetails/hooks/utils";
import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";
import {
  postCommentsQueryKey,
  type PostCommentsQueryData,
} from "@/features/parts/postDetails/hooks/usePostComments";
import type {
  CommentMetaEventPayload,
  PostDetailCommentDeletedEventPayload,
  PostDetailCommentEventPayload,
  PostDetailCommentUpdatedEventPayload,
} from "./types";

export function applyPostDetailCommentUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentEventPayload
) {
  if (!payload.postId) {
    return;
  }

  const parentId = payload.replyToId ?? null;
  const cacheKey = postCommentsQueryKey(payload.postId, parentId);
  const commentToInsert = mapCommentEventToListItem(payload);

  queryClient.setQueryData<PostCommentsQueryData>(cacheKey, (current) =>
    insertCommentAtTop(current, commentToInsert, commentToInsert.id)
  );
}

export function applyPostDetailCommentDeletedUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentDeletedEventPayload
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }

  const parentId = payload.parentId ?? null;
  const cacheKey = postCommentsQueryKey(payload.postId, parentId);

  queryClient.setQueryData<PostCommentsQueryData | undefined>(
    cacheKey,
    (currentData) =>
      removeCommentFromCache(currentData, payload.commentId) as
        | PostCommentsQueryData
        | undefined
  );
}

export function applyPostDetailCommentEditedUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentUpdatedEventPayload
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }

  const parentId = payload.parentId ?? null;
  const cacheKey = postCommentsQueryKey(payload.postId, parentId);

  const mapComment = (comment: PostCommentListItem) =>
    comment.id === payload.commentId
      ? {
          ...comment,
          content: payload.content ?? comment.content,
          updatedAt: payload.updatedAt ?? comment.updatedAt,
          isEdited: payload.isEdited ?? true,
        }
      : comment;

  queryClient.setQueryData<PostCommentsQueryData | undefined>(
    cacheKey,
    (currentData) => {
      if (!currentData) return currentData;
      if (!Array.isArray(currentData.pages)) return currentData;

      return {
        ...currentData,
        pages: currentData.pages.map((page) => ({
          ...page,
          comments: page.comments.map(mapComment),
        })),
        items: Array.isArray(currentData.items)
          ? currentData.items.map(mapComment)
          : currentData.items,
      };
    }
  );
}

export function mapCommentEventToListItem(
  payload: PostDetailCommentEventPayload
): PostCommentListItem {
  const timestamp = payload.createdAt ?? new Date().toISOString();
  const content =
    payload.contentHtml?.trim() || payload.contentPreview?.trim() || "";
  const displayName = payload.authorName || payload.authorUsername || "Someone";

  return {
    id: payload.commentId,
    postId: payload.postId,
    parentId: payload.replyToId ?? null,
    authorId: payload.authorId,
    content,
    reactionSummary: null,
    reactionsCount: 0,
    viewerReaction: null,
    replyCount: 0,
    createdAt: timestamp,
    updatedAt: payload.updatedAt ?? timestamp,
    isEdited: Boolean(payload.isEdited),
    author: {
      id: payload.authorId,
      name: displayName,
      username: payload.authorUsername ?? null,
      avatarUrl: payload.authorAvatarUrl ?? null,
    },
  };
}

export function applyCommentMetaUpdate(
  queryClient: QueryClient,
  payload: CommentMetaEventPayload
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }

  const parentId = payload.parentId ?? null;
  const cacheKey = postCommentsQueryKey(payload.postId, parentId);

  const updateComment = (comment: PostCommentListItem) => {
    if (comment.id !== payload.commentId) return comment;

    return {
      ...comment,
      reactionsCount: payload.reactionsCount,
      reactionSummary: payload.reactionSummary,
      ...(payload.repliesCount !== undefined && {
        replyCount: payload.repliesCount,
      }),
    };
  };

  queryClient.setQueryData<PostCommentsQueryData | undefined>(
    cacheKey,
    (currentData) => {
      if (!currentData) return currentData;
      if (!Array.isArray(currentData.pages)) return currentData;

      return {
        ...currentData,
        pages: currentData.pages.map((page) => ({
          ...page,
          comments: page.comments.map(updateComment),
        })),
        items: Array.isArray(currentData.items)
          ? currentData.items.map(updateComment)
          : currentData.items,
      };
    }
  );
}
