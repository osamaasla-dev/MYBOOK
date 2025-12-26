"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  changeDirectParentReplyCount,
  insertCommentAtTop,
  removeCommentFromCache,
  updateCommentInCache,
} from "@/features/parts/postDetails/hooks/utils";
import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
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
import {
  CommentRepliesQueryData,
  commentRepliesQueryKey,
} from "@/features/parts/postDetails/hooks";

export function applyPostDetailCommentUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentEventPayload,
  currentUserId?: string
) {
  if (!payload.postId) {
    return;
  }

  // Skip if current user is the author (to avoid duplicates)
  if (currentUserId && payload.authorId === currentUserId) {
    console.log("Skipping own comment create to avoid duplicate");
    return;
  }

  const commentsCacheKey = postCommentsQueryKey(payload.postId);

  const commentToInsert = mapCommentEventToListItem(payload);

  if (payload.replyToId) {
    const replyCacheKey = commentRepliesQueryKey(
      payload.postId,
      payload.replyToId
    );
    queryClient.setQueryData<CommentRepliesQueryData>(
      replyCacheKey,
      (current) => insertCommentAtTop(current, commentToInsert)
    );
    changeDirectParentReplyCount(
      queryClient,
      commentsCacheKey,
      payload.replyToId,
      1
    );
  } else {
    queryClient.setQueryData<PostCommentsQueryData>(
      commentsCacheKey,
      (current) =>
        insertCommentAtTop(current, commentToInsert, commentToInsert.id)
    );
  }
}

export function applyPostDetailCommentDeletedUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentDeletedEventPayload,
  currentUserId?: string
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }

  // Skip if current user is the author (to avoid duplicates)
  if (currentUserId && payload.initiatorId === currentUserId) {
    console.log("Skipping own comment delete to avoid duplicate");
    return;
  }
  const parentId = payload.parentId ?? null;
  const cacheKey = parentId
    ? commentRepliesQueryKey(payload.postId, parentId)
    : postCommentsQueryKey(payload.postId);

  queryClient.setQueryData<
    PostCommentsQueryData | CommentRepliesQueryData | undefined
  >(
    cacheKey,
    (currentData) =>
      removeCommentFromCache(currentData, payload.commentId) as
        | PostCommentsQueryData
        | CommentRepliesQueryData
        | undefined
  );
  if (parentId) {
    const parentCacheKey = postCommentsQueryKey(payload.postId);
    changeDirectParentReplyCount(queryClient, parentCacheKey, parentId, -1);
  }
}

export function applyPostDetailCommentEditedUpdate(
  queryClient: QueryClient,
  payload: PostDetailCommentUpdatedEventPayload,
  currentUserId?: string
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }
  // Skip if current user is the author (to avoid duplicates)
  if (currentUserId && payload.authorId === currentUserId) {
    console.log("Skipping own comment update to avoid duplicate");
    return;
  }
  console.log("payload", payload.authorId);
  console.log(currentUserId);
  const parentId = payload.parentId ?? null;
  const cacheKey = parentId
    ? commentRepliesQueryKey(payload.postId, parentId)
    : postCommentsQueryKey(payload.postId);

  updateCommentInCache(queryClient, cacheKey, {
    id: payload.commentId,
    content: payload.content ?? "",
    updatedAt: payload.updatedAt ?? null,
  });
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

export function updateCommentMetaInCache(
  queryClient: QueryClient,
  cacheKey:
    | ReturnType<typeof commentRepliesQueryKey>
    | ReturnType<typeof postCommentsQueryKey>,
  commentId: string,
  updates: {
    reactionsCount?: number;
    reactionSummary?: ReactionSummary | null;
    replyCount?: number;
  }
) {
  const updateComment = (comment: PostCommentListItem) => {
    if (comment.id !== commentId) return comment;

    return {
      ...comment,
      ...(updates.reactionsCount !== undefined && {
        reactionsCount: updates.reactionsCount,
      }),
      ...(updates.reactionSummary !== undefined && {
        reactionSummary: updates.reactionSummary,
      }),
      ...(updates.replyCount !== undefined && {
        replyCount: updates.replyCount,
      }),
    };
  };

  queryClient.setQueryData<
    PostCommentsQueryData | CommentRepliesQueryData | undefined
  >(cacheKey, (currentData) => {
    if (!currentData) return currentData;
    if (!Array.isArray(currentData.pages)) return currentData;

    return {
      ...currentData,
      pages: currentData?.pages?.map((page) => ({
        ...page,
        comments: page?.comments?.map(updateComment),
      })),
      items: Array.isArray(currentData.items)
        ? currentData?.items?.map(updateComment)
        : currentData?.items,
    };
  });
}

export function applyCommentMetaUpdate(
  queryClient: QueryClient,
  payload: CommentMetaEventPayload,
  currentUserId?: string
) {
  if (!payload.postId || !payload.commentId) {
    return;
  }
  // Skip if current user is the author (to avoid duplicates)
  if (currentUserId && payload.initiatorId === currentUserId) {
    console.log("Skipping own comment update to avoid duplicate");
    return;
  }
  const parentId = payload.parentId ?? null;

  // Update the comment/reply itself
  const targetCacheKey = parentId
    ? commentRepliesQueryKey(payload.postId, parentId)
    : postCommentsQueryKey(payload.postId);
  console.log(payload.parentId);
  updateCommentMetaInCache(queryClient, targetCacheKey, payload.commentId, {
    reactionsCount: payload.reactionsCount,
    reactionSummary: payload.reactionSummary,
    replyCount: payload.replyCount,
  });

  // If this is a reply, also update the parent comment's reply count
  if (parentId) {
    const parentCacheKey = postCommentsQueryKey(payload.postId);
    updateCommentMetaInCache(queryClient, parentCacheKey, parentId, {
      replyCount: payload.replyCount,
    });
  }
}
