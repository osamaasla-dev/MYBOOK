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
  PostDetailCommentDeletedEventPayload,
  PostDetailCommentEventPayload,
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
    replyCount: 0,
    createdAt: timestamp,
    updatedAt: payload.updatedAt ?? timestamp,
    author: {
      id: payload.authorId,
      name: displayName,
      username: payload.authorUsername ?? null,
      avatarUrl: payload.authorAvatarUrl ?? null,
    },
  };
}
